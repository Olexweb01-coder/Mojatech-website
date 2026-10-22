import { guard } from "../guard";
import { streamReply, configured, NoProviderError, type ChatMessage, type Intent } from "@/lib/arik/providers";
import { systemPrompt } from "@/lib/arik/context";
import { REMIND_HINT, handleReminder } from "@/lib/arik/reminders";
import { imagesConfigured, takeImage, giveBack, makeImage, shapeFor, dailyLimit, imagesUsedToday, PROMPT_WRITER } from "@/lib/arik/images";
import {
  ownerKey, ownsChat, createChat, getMessages, addMessage, dropLastAssistant, getFiles, getArikSettings, saveFile, type FileRef,
} from "@/lib/arik/store";

/* One turn of a conversation with Arik. Streams the answer back as it is
 * written (server-sent events), then saves both sides of the exchange. */

export const maxDuration = 120;

const LONG = 24_000;            /* characters of documents beyond which a big-memory model is used */
const DOC_LIMIT = 400_000;      /* characters of one document sent to the model */

const WEB_HINT = /\b(today|latest|news|current(ly)?|this week|right now|price of|exchange rate|dollar rate|weather|who won|search (the )?(web|internet)|look ?up online)\b/i;
const IMAGE_HINT = /\b(generate|create|make|draw|design|produce|render|paint|sketch)\b[^.?!]{0,50}\b(image|picture|photo|pic|flyer|poster|logo|banner|illustration|graphic|artwork|thumbnail|wallpaper|mock-?up|advert|ad creative)s?\b|^\s*(image|draw|picture)\s*:/i;
const EDIT_HINT = /\b(edit (this|the|it|my)|remove the|replace the|change the (background|colou?rs?|sky|text)|(new|white|plain|different) background|background (to|with)|retouch|recolou?r|turn (it|this) into|make (it|this) look|add (a|an|the|our) .{0,30}(logo|text|sign|person|people|panel))\b/i;
const DEEP_HINT = /\b(proposal|report|business plan|analy[sz]e|detailed|step[- ]by[- ]step|compare|strategy|calculate|design|sizing|quotation)\b/i;

export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const me = g.me;
  const owner = ownerKey(me);

  const body = await req.json().catch(() => null) as null | { chatId?: string; text?: string; fileIds?: string[]; mode?: string; voice?: boolean; retry?: boolean };
  if (!body) return Response.json({ error: "Bad request." }, { status: 400 });
  if (!configured().length) return Response.json({ error: "setup" }, { status: 503 });

  const text = String(body.text || "").slice(0, 20_000).trim();
  let chatId = body.chatId && (await ownsChat(owner, body.chatId)) ? body.chatId : null;
  const fileIds = (body.fileIds || []).slice(0, 8);
  if (!body.retry && !text && !fileIds.length) return Response.json({ error: "Say something first." }, { status: 400 });

  /* Save the question (or, for "try again", drop the previous answer). */
  const files = await getFiles(owner, fileIds);
  const refs: FileRef[] = files.map((f) => ({ id: f.id, name: f.name, kind: f.kind, chars: f.text.length || undefined }));
  if (!chatId) chatId = await createChat(owner, text.replace(/\s+/g, " ").slice(0, 60) || files[0]?.name || "New chat");
  if (body.retry) await dropLastAssistant(chatId);
  else await addMessage(chatId, "user", text, refs);

  /* Rebuild the conversation for the model, with document text and photos attached
     to the messages they came with. Only the latest 30 turns are sent. */
  const history = (await getMessages(chatId)).slice(-30);
  const allIds = [...new Set(history.flatMap((m) => m.files.map((f) => f.id)))];
  const stored = new Map((await getFiles(owner, allIds)).map((f) => [f.id, f]));
  const settings = await getArikSettings();

  let docChars = 0, hasImage = false;
  const lastUserIndex = history.map((m) => m.role).lastIndexOf("user");
  const messages: ChatMessage[] = [{ role: "system", content: await systemPrompt(me, settings.name, Boolean(body.voice)) }];
  history.forEach((m, i) => {
    const docs = m.files.map((f) => stored.get(f.id)).filter((f) => f?.kind === "doc");
    const imgs = m.files.map((f) => stored.get(f.id)).filter((f) => f?.kind === "image" && f.bytes);
    const docText = docs.map((d) => `\n\n[Document: ${d!.name}]\n${d!.text.slice(0, DOC_LIMIT)}\n[End of ${d!.name}]`).join("");
    docChars += docText.length;
    /* Photos are sent only with the latest question, to keep requests small. */
    if (m.role === "user" && imgs.length && i === lastUserIndex) {
      hasImage = true;
      messages.push({ role: "user", content: [
        { type: "text", text: (m.content || "What is in this photo?") + docText },
        ...imgs.map((f) => ({ type: "image_url" as const, image_url: { url: `data:${f!.mime};base64,${f!.bytes!.toString("base64")}` } })),
      ] });
    } else {
      const note = m.role === "user" && imgs.length ? `\n\n(Earlier, the person shared ${imgs.length} photo${imgs.length > 1 ? "s" : ""}: ${imgs.map((f) => f!.name).join(", ")}.)` : "";
      messages.push({ role: m.role, content: (m.content || "(see attachment)") + docText + note });
    }
  });

  const lastText = history[lastUserIndex]?.content || text;
  const mode = body.mode || "auto";

  /* Pictures: asked for in Image mode, or recognised from the request. */
  const latestImages = (history[lastUserIndex]?.files || []).map((f) => stored.get(f.id)).filter((f) => f?.kind === "image" && f.bytes);
  const wantsImage = !body.voice && (mode === "image" || (mode === "auto" && (IMAGE_HINT.test(lastText) || (latestImages.length > 0 && EDIT_HINT.test(lastText)))));
  if (!wantsImage && !body.retry && text && REMIND_HINT.test(text)) {
    const reply = await handleReminder(text, owner, req.signal).catch(() => null);
    if (reply) return quickTurn(chatId, reply, req.signal);
  }
  if (wantsImage) return imageTurn({ chatId, owner, lastText, latestImages: latestImages as { id: string; name: string; mime: string; bytes: Buffer }[], history: history.slice(-6), signal: req.signal });
  const intent: Intent = hasImage ? "vision"
    : mode === "fast" || mode === "deep" || mode === "web" ? mode
    : WEB_HINT.test(lastText) ? "web" : DEEP_HINT.test(lastText) && lastText.length > 40 ? "deep" : "fast";
  const long = docChars > LONG;

  const enc = new TextEncoder();
  const id = chatId;
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (o: unknown) => { if (open) try { controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { open = false; } };
      send({ chatId: id });
      let answer = "";
      let provider = "";
      try {
        const r = await streamReply(messages, {
          intent, long, signal: req.signal,
          onToken: (t) => { answer += t; send({ t }); },
          onSwitch: (label) => send({ via: label }),
        });
        provider = r.provider;
      } catch (e) {
        const msg = e instanceof NoProviderError ? "setup" : e instanceof Error ? e.message : "Something went wrong.";
        send({ error: msg });
      } finally {
        if (answer.trim()) await addMessage(id, "assistant", answer, [], { provider, intent }).catch(() => {});
        send({ done: true, provider });
        if (open) try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}

/* ---------- An answer that is already worked out (a reminder was set) ---------- */

function quickTurn(chatId: string, content: string, signal: AbortSignal) {
  const enc = new TextEncoder();
  void signal;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (x: unknown) => { try { controller.enqueue(enc.encode(`data: ${JSON.stringify(x)}\n\n`)); } catch { /* closed */ } };
      send({ chatId });
      send({ t: content });
      await addMessage(chatId, "assistant", content, [], { intent: "reminder", provider: "Schedule" }).catch(() => {});
      send({ done: true, provider: "Schedule" });
      try { controller.close(); } catch { /* closed */ }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform" } });
}

/* ---------- A picture instead of a text answer ---------- */

function imageTurn(o: {
  chatId: string; owner: string; lastText: string; signal: AbortSignal;
  latestImages: { id: string; name: string; mime: string; bytes: Buffer }[];
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (x: unknown) => { if (open) try { controller.enqueue(enc.encode(`data: ${JSON.stringify(x)}\n\n`)); } catch { open = false; } };
      const finish = async (content: string, files: FileRef[] = [], meta: Record<string, unknown> = {}) => {
        if (content) { send({ t: content }); await addMessage(o.chatId, "assistant", content, files, { intent: "image", ...meta }).catch(() => {}); }
        send({ done: true, provider: meta.provider || "" });
        if (open) try { controller.close(); } catch { /* closed */ }
      };
      send({ chatId: o.chatId });

      if (!imagesConfigured()) {
        return finish("Pictures are not set up yet. Add **CLOUDFLARE_ACCOUNT_ID** and **CLOUDFLARE_API_TOKEN** (a free Cloudflare account, token with the Workers AI permission) to .env.local and Vercel, then restart.");
      }
      const editing = o.latestImages.length > 0;

      /* 1. Arik writes a strong prompt from the request and the recent conversation. */
      send({ status: "Writing the prompt…" });
      let prompt = "";
      try {
        const context = o.history.filter((m) => m.content).map((m) => `${m.role === "user" ? "Person" : "Assistant"}: ${m.content.slice(0, 600)}`).join("\n");
        await streamReply([
          { role: "system", content: PROMPT_WRITER },
          { role: "user", content: `Recent conversation:\n${context}\n\nRequest: ${o.lastText || "Improve this photo."}${editing ? `\n\n(The person shared ${o.latestImages.length} photo${o.latestImages.length > 1 ? "s" : ""} to edit.)` : ""}` },
        ], { intent: "fast", long: false, signal: o.signal, onToken: (t) => { prompt += t; } });
      } catch { prompt = o.lastText; }
      prompt = prompt.trim().replace(/^["']|["']$/g, "");
      if (o.signal.aborted) return finish("");
      if (/^REFUSE:/i.test(prompt)) return finish(`I can't make that picture: ${prompt.replace(/^REFUSE:\s*/i, "")}`);
      if (!prompt) prompt = o.lastText;

      /* 2. Today's allowance. */
      if (!(await takeImage())) {
        return finish(`Today's ${dailyLimit()} pictures have all been used. The allowance resets at midnight. Here is the prompt I would have used, so you can try it then:\n\n> ${prompt}`);
      }

      /* 3. The picture. */
      send({ status: editing ? "Editing your photo…" : "Creating your picture…" });
      try {
        const out = await makeImage(prompt, shapeFor(o.lastText), o.latestImages.map((f) => ({ bytes: f.bytes, mime: f.mime })));
        const ext = out.mime.split("/")[1] || "png";
        const name = `mojatech-${editing ? "edit" : "image"}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.${ext}`;
        const id = await saveFile(o.owner, { name, mime: out.mime, kind: "image", text: "", bytes: out.bytes });
        const ref: FileRef = { id, name, kind: "image" };
        send({ image: ref });
        const left = Math.max(0, dailyLimit() - (await imagesUsedToday()));
        await finish(`${editing ? "Here is the edited photo." : "Here is your picture."} Tap **Edit this** to change it, or tell me what to adjust.\n\n**Prompt used:** ${prompt}\n\n_${left} of ${dailyLimit()} pictures left today._`, [ref], { provider: out.model });
      } catch (e) {
        await giveBack();
        console.error("image failed", e);
        await finish(`The picture could not be made (${e instanceof Error ? e.message.slice(0, 120) : "image service error"}). It did not count against today's allowance. Try again, or rephrase the request.`);
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
}
