interface Props {
  /** Enter the app (Log in / Sign up both lead into the quiz app). */
  onEnter: () => void;
}

/**
 * Fixed top bar. Offsets right of the 240px sidebar on desktop, full width on
 * mobile. Brand on the left, section links + auth buttons on the right.
 */
export default function Navbar({ onEnter }: Props) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#e8e8e8] bg-[#fefffc]/90 backdrop-blur-sm lg:left-[240px]">
      <div className="flex h-16 items-center justify-between px-5 lg:px-10">
        <a href="#home" className="font-mondwest text-[28px] leading-none lg:text-[32px]">
          Flow
        </a>
        <div className="flex items-center gap-2 lg:gap-4">
          <a
            href="#features"
            className="hidden text-[15px] text-[#646464] transition-colors hover:text-[#2c2c2c] lg:inline"
          >
            Features
          </a>
          <a
            href="#demo"
            className="hidden text-[15px] text-[#646464] transition-colors hover:text-[#2c2c2c] lg:inline"
          >
            Demo
          </a>
          <button
            onClick={onEnter}
            className="rounded-full border-2 border-[#dde3dd] bg-white px-4 py-2 text-[14px] transition-colors hover:bg-[#eef1ed]"
          >
            Log in
          </button>
          <button
            onClick={onEnter}
            className="rounded-full bg-black px-4 py-2 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
          >
            Start studying
          </button>
        </div>
      </div>
    </header>
  );
}
