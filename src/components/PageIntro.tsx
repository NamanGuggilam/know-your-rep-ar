import { ListenButton } from "./a11y/ListenButton";

/** Page title, short intro, and a Listen button that reads the whole page body. */
export function PageIntro({ title, intro, bodyId }: { title: string; intro: React.ReactNode; bodyId: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl leading-tight font-extrabold">{title}</h1>
      <p className="mt-3 max-w-[60ch] text-xl">{intro}</p>
      <div className="mt-4">
        <ListenButton targetId={bodyId} label="Listen to this page" />
      </div>
    </div>
  );
}

export function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
