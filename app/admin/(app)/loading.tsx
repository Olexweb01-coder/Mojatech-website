/* Shown the instant a section is tapped, while its data loads. */
export default function Loading() {
  return (
    <div className="mja-skel" aria-busy="true" aria-label="Loading">
      <i /><i /><i /><i />
    </div>
  );
}
