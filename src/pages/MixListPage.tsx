import { MixCard } from '../components/MixCard';
import { mixes } from '../data/mixes';

export function MixListPage() {
  return (
    <section className="mix-list" aria-labelledby="mix-list-title">
      <title>St. Marco</title>
      <h1 id="mix-list-title" className="mix-list__title">
        Mixes
      </h1>
      <ol className="mix-list__items" role="list">
        {mixes.map((mix) => (
          <li key={mix.id} className="mix-list__item">
            <MixCard mix={mix} />
          </li>
        ))}
      </ol>
    </section>
  );
}
