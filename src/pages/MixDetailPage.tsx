import { Link, useParams } from 'react-router';
import { BackArrowIcon } from '../components/icons/BackArrowIcon';
import { MixCover } from '../components/MixCover';
import { PlayToggleButton } from '../components/PlayToggleButton';
import { Tracklist } from '../components/Tracklist';
import { getMixBySlug } from '../data/mixes';
import { formatDate, formatDuration } from '../player/format';
import { usePlayerState } from '../player/usePlayer';
import { NotFoundPage } from './NotFoundPage';

export function MixDetailPage() {
  const { slug } = useParams();
  const mix = getMixBySlug(slug);
  const isPlaying = usePlayerState((state) => state.isPlaying && state.mixId === mix?.id);
  if (!mix) return <NotFoundPage />;

  return (
    <article className="mix-detail">
      <title>{`${mix.title} · St. Marco`}</title>
      <Link to="/" className="mix-detail__back">
        <BackArrowIcon />
        All mixes
      </Link>
      <header className="mix-detail__header">
        <MixCover mix={mix} className="mix-detail__cover" spinning={isPlaying} />
        <div className="mix-detail__intro">
          <h1 className="mix-detail__title">{mix.title}</h1>
          <p className="mix-detail__meta">
            <time className="mix-detail__date" dateTime={mix.date}>
              {formatDate(mix.date)}
            </time>
            <span aria-hidden="true"> · </span>
            <span className="mix-detail__length">{formatDuration(mix.durationSeconds)}</span>
          </p>
          <PlayToggleButton mix={mix} withLabel />
        </div>
      </header>
      {mix.description && <p className="mix-detail__description">{mix.description}</p>}
      {mix.tracklist && mix.tracklist.length > 0 && <Tracklist mix={mix} />}
    </article>
  );
}
