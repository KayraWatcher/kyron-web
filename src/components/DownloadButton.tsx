import { APK_RELEASE } from '../config/appConfig'

interface Props {
  className?: string
  size?: 'sm' | 'lg'
}

/**
 * Yapılandırılabilir APK indirme butonu.
 *
 * `APK_RELEASE.url` null olduğu sürece buton aktif link basmaz;
 * "yakında" durumunda görünür ve `aria-disabled` olarak işaretlenir.
 */
export default function DownloadButton({ className = '', size = 'sm' }: Props) {
  const href = APK_RELEASE.url
  const available = Boolean(href)

  const classes = [
    'btn',
    size === 'lg' ? 'btn--lg' : '',
    available ? 'btn--primary' : 'btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const label = 'Android için indir'

  if (!available) {
    return (
      <span
        className={classes}
        role="link"
        aria-disabled="true"
        title="APK bağlantısı henüz yayında değil"
      >
        <DownloadIcon />
        {label}
      </span>
    )
  }

  return (
    <a className={classes} href={href ?? undefined} download>
      <DownloadIcon />
      {label}
    </a>
  )
}

export function DownloadIcon() {
  return (
    <svg className="btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v11m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
