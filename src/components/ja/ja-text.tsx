import { Fragment } from "react";
import { isPunct, rubyOf } from "@/lib/content/derive";
import type { Ja } from "@/lib/content/schema";

type JaTextProps = {
  tokens: Ja;
  className?: string;
};

// Baris boleh putus sebelum kata isi; partikel, kata bantu, sufiks, dan tanda baca
// menempel ke kata sebelumnya. Lihat docs/DESIGN_SYSTEM.md (pemutusan baris).
const startsPhrase = (tok: Ja[number]) => !tok.prt && !tok.aux && !tok.suffix && !isPunct(tok.t);

export function JaText({ tokens, className = "" }: JaTextProps) {
  return (
    <span lang="ja" className={`font-ja ${className}`}>
      {tokens.map((tok, i) => (
        <Fragment key={i}>
          {i > 0 && startsPhrase(tok) && <wbr />}
          {rubyOf([tok]).map((seg, j) =>
            seg.r ? (
              <ruby key={j}>
                {seg.b}
                <rp>（</rp>
                <rt>{seg.r}</rt>
                <rp>）</rp>
              </ruby>
            ) : (
              <Fragment key={j}>{seg.b}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </span>
  );
}
