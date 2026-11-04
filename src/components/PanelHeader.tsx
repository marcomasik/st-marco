import { Link } from 'react-router';
import { createRandom } from '../drawing/random';
import { Star } from './doodles/Doodles';
import { Wordmark } from './Wordmark';

/** Same condition as the "panel hangs below the island" layout in _scene.scss. */
const HANGING_LAYOUT = '(min-width: 600px) and (min-height: 600px)';

const sky = (format: string) =>
  `/img/header-sky-960.${format} 960w, /img/header-sky-1920.${format} 1920w`;
const island = (format: string) =>
  `/img/header-island-600.${format} 600w, /img/header-island-720.${format} 720w, /img/header-island-920.${format} 920w`;

/** Scalloped cloud edge where the photo strip meets the paper. Drawn once. */
const CLOUD_EDGE = (() => {
  const random = createRandom(9);
  const base = 30;
  let x = -14;
  let outline = `M${x} ${base}`;
  while (x < 734) {
    const width = 34 + random() * 30;
    const radius = width * (0.56 + random() * 0.1);
    const y = base + (random() - 0.5) * 5;
    x += width;
    outline += ` A${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return { outline, fill: `${outline} L${x.toFixed(1)} 60 L-14 60 Z` };
})();

/**
 * Top of the panel: a strip of the real photo with doodles over it and the wordmark.
 * Phones show the island itself (the panel covers the background there); the hanging
 * layout shows only sky, since the island is visible above the panel.
 */
export function PanelHeader() {
  return (
    <header className="panel-header">
      <div className="panel-header__photo">
        <picture>
          <source media={HANGING_LAYOUT} type="image/avif" srcSet={sky('avif')} sizes="720px" />
          <source media={HANGING_LAYOUT} type="image/webp" srcSet={sky('webp')} sizes="720px" />
          <source media={HANGING_LAYOUT} srcSet={sky('jpg')} sizes="720px" />
          <source type="image/avif" srcSet={island('avif')} sizes="calc(100vw - 48px)" />
          <source type="image/webp" srcSet={island('webp')} sizes="calc(100vw - 48px)" />
          <img
            className="panel-header__img"
            src="/img/header-island-920.jpg"
            srcSet={island('jpg')}
            sizes="calc(100vw - 48px)"
            width={920}
            height={511}
            alt=""
          />
        </picture>
      </div>
      <Star className="panel-header__star is-a" seed={41} />
      <Star className="panel-header__star is-b" seed={47} fill="cloud" />
      <Star className="panel-header__star is-c" seed={53} fill="orange" />
      <Link to="/" className="panel-header__home" aria-label="St. Marco, all mixes">
        <Wordmark />
      </Link>
      <svg
        className="panel-header__clouds doodle"
        viewBox="0 0 720 60"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <path className="doodle__fill-paper" d={CLOUD_EDGE.fill} />
        <path className="doodle__ink" strokeWidth={2.6} d={CLOUD_EDGE.outline} />
      </svg>
    </header>
  );
}
