const PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  sheet: (
    <path d="M4.5 4.5h15v15h-15zM4.5 9.5h15M4.5 14.5h15M9.5 4.5v15" />
  ),
  check: <path d="M5 12.5l4.3 4.3L19 6.8" />,
  pencil: (
    <>
      <path d="M4.7 19.3L9.3 17.8 19.3 7.8 16.2 4.7 6.2 14.7Z" />
      <path d="M9.3 17.8 6.2 14.7" />
    </>
  ),
  trash: (
    <path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 10.5v6M14 10.5v6" />
  ),
  download: (
    <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 20.5h15" />
  ),
  upload: <path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8M4.5 20.5h15" />,
  file: (
    <path d="M5.5 3.5H13.5L18.5 8v12.5h-13zM13.5 3.5V8h5M9 12.5h6M9 16h6" />
  ),
  users: (
    <>
      <circle cx="8.2" cy="7.8" r="3.2" />
      <path d="M3.2 20.5a5 5 0 0 1 10 0" />
      <circle cx="17.1" cy="9.4" r="2.6" />
      <path d="M13.7 20.5a3.4 3.4 0 0 1 6.8 0" />
    </>
  ),
}

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
