/**
 * Label that opens a part of the learning plan (learning now, up later,
 * finished), with a rule fading out to the right. Set in caps rather than
 * display type, so it reads as a section marker and the focus area titles stay
 * the largest type in the list.
 */
export default function ChapterLabel({ as: Tag = 'p', id, children }) {
  return (
    <div className="lp-chapter">
      <Tag id={id} className="lp-chapter-label">
        {children}
      </Tag>
      <span aria-hidden="true" className="lp-chapter-rule" />
    </div>
  );
}
