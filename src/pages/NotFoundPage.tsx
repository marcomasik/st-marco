import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="not-found">
      <title>Not found · St. Marco</title>
      <h1 className="not-found__title">Lost at sea</h1>
      <p className="not-found__text">This page drifted off somewhere.</p>
      <Link to="/" className="not-found__link">
        Back to all mixes
      </Link>
    </section>
  );
}
