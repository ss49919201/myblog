/* eslint-disable @typescript-eslint/no-unused-vars */
export const MarkdownH1 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className="retro-title text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 mt-6 sm:mt-8 first:mt-0">
    🔥 {props.children}
  </h1>
);

export const MarkdownH2 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="retro-title text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 mt-5 sm:mt-6 first:mt-0">
    ⚡ {props.children}
  </h2>
);

export const MarkdownH3 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className="retro-title text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3 mt-4 sm:mt-5 first:mt-0">
    💫 {props.children}
  </h3>
);

export const MarkdownP = (props: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="retro-text mb-4 sm:mb-6 leading-relaxed">
    {props.children}
  </p>
);

export const MarkdownUL = (props: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className="retro-text mb-4 sm:mb-6 space-y-1 sm:space-y-2 pl-4 sm:pl-6">
    {props.children}
  </ul>
);

export const MarkdownOL = (props: React.HTMLAttributes<HTMLOListElement>) => (
  <ol className="retro-text mb-4 sm:mb-6 space-y-1 sm:space-y-2 pl-4 sm:pl-6 list-decimal">
    {props.children}
  </ol>
);

export const MarkdownLI = (props: React.HTMLAttributes<HTMLLIElement>) => (
  <li className="relative">
    <span className="absolute -left-4 sm:-left-6 text-retro-orange font-bold">
      &gt;
    </span>
    {props.children}
  </li>
);

export const MarkdownA = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a 
    href={props.href} 
    className="retro-link text-retro-blue hover:text-retro-orange font-bold border-b-2 border-retro-blue hover:border-retro-orange transition-colors duration-200"
    target={props.href?.startsWith('http') ? '_blank' : undefined}
    rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
  >
    🔗 {props.children}
  </a>
);

export const MarkdownStrong = (props: React.HTMLAttributes<HTMLElement>) => (
  <strong className="font-bold text-retro-orange bg-retro-yellow bg-opacity-20 px-1 rounded">
    {props.children}
  </strong>
);