const LINKEDIN_URL = "https://www.linkedin.com/in/jonas-nygaard-0aa767366";

const GITHUB_URL = "https://github.com/JonnyNewfarm";

export default function ServicesFooter() {
  return (
    <footer
      className="
        border-t
        border-current/20
        px-[5vw]
        pb-8
        pt-6
        font-sans
        text-[10px]
        font-bold
        uppercase
        md:px-[3%]
        md:pb-10
        md:pt-8
        md:text-xs
      "
    >
      <div className="flex items-center justify-between gap-4">
        <span>OSLO, NORWAY</span>

        <span>© 2026 JONAS NYGAARD</span>
      </div>

      <nav
        aria-label="Social links"
        className="mt-6 flex items-center justify-end gap-2"
      >
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity duration-200 hover:opacity-50"
        >
          LINKEDIN
        </a>

        <span>/</span>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity duration-200 hover:opacity-50"
        >
          GITHUB
        </a>
      </nav>
    </footer>
  );
}
