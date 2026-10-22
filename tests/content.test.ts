import { test } from "node:test";
import assert from "node:assert/strict";
import { align } from "../src/lib/content/align.ts";
import { conjugate } from "../src/lib/content/conjugate.ts";
import { romajiOf } from "../src/lib/content/derive.ts";
import { romanizeWord } from "../src/lib/content/kana.ts";

test("romanizeWord: vokal panjang, ii, ei, ー, n', っ", () => {
  const cases: [string, string][] = [
    ["とうきょう", "tōkyō"], ["べんきょう", "benkyō"], ["おかあさん", "okāsan"], ["おにいさん", "oniisan"],
    ["せんせい", "sensei"], ["がっこう", "gakkō"], ["まっちゃ", "matcha"], ["こーひー", "kōhī"],
    ["コーヒー", "kōhī"], ["きんようび", "kin'yōbi"], ["しんじゅく", "shinjuku"], ["じゃあ", "jā"],
    ["ちゅうごく", "chūgoku"], ["インドネシア", "indoneshia"], ["フィリピン", "firipin"], ["チェン", "chen"],
  ];
  for (const [kana, roma] of cases) assert.equal(romanizeWord(kana), roma, kana);
  assert.equal(romanizeWord("おもう", { keepFinalU: true }), "omou");
});

test("romajiOf: partikel, spasi, sufiks, kapital, 〜する majemuk", () => {
  assert.equal(
    romajiOf([
      { t: "リナ", proper: true }, { t: "さん", suffix: true }, { t: "は", prt: true },
      { t: "インドネシア", proper: true }, { t: "から", prt: true },
      { t: "来ました", r: "きました", lemma: "来る", lemmaR: "くる", form: "mashita" }, { t: "か", prt: true }, { t: "？" },
    ]),
    "Rina-san wa Indoneshia kara kimashita ka?",
  );
  assert.equal(
    romajiOf([
      { t: "日本語", r: "にほんご", proper: true }, { t: "を", prt: true },
      { t: "勉強して", r: "べんきょうして", lemma: "勉強する", lemmaR: "べんきょうする", form: "te" },
      { t: "います", lemma: "いる", lemmaR: "いる", form: "masu", aux: true }, { t: "。" },
    ]),
    "Nihongo o benkyō shite imasu.",
  );
  assert.equal(
    romajiOf([{ t: "自己", r: "じこ" }, { t: "紹介", r: "しょうかい" }, { t: "を", prt: true }]),
    "Jiko shōkai o",
  );
});

test("align: okurigana dan jukujikun", () => {
  assert.deepEqual(align("行きます", "いきます"), [{ b: "行", r: "い" }, { b: "きます" }]);
  assert.deepEqual(align("今日", "きょう"), [{ b: "今日", r: "きょう" }]);
  assert.deepEqual(align("住んでいます", "すんでいます"), [{ b: "住", r: "す" }, { b: "んでいます" }]);
  assert.deepEqual(align("インドネシア人", "いんどねしあじん"), [{ b: "インドネシア" }, { b: "人", r: "じん" }]);
  assert.throws(() => align("行きます", "いくます"));
});

test("conjugate: kelompok I, II, III dan pengecualian", () => {
  const c = (l: string, r: string, cls: Parameters<typeof conjugate>[2], f: Parameters<typeof conjugate>[3]) =>
    conjugate(l, r, cls, f).surface;
  assert.equal(c("行く", "いく", "v5k-s", "te"), "行って");
  assert.equal(c("書く", "かく", "v5k", "te"), "書いて");
  assert.equal(c("泳ぐ", "およぐ", "v5g", "te"), "泳いで");
  assert.equal(c("住む", "すむ", "v5m", "te"), "住んで");
  assert.equal(c("働く", "はたらく", "v5k", "masu"), "働きます");
  assert.equal(c("帰る", "かえる", "v5r", "te"), "帰って");
  assert.equal(c("食べる", "たべる", "v1", "masendeshita"), "食べませんでした");
  assert.equal(c("ある", "ある", "v5r-i", "nai"), "ない");
  assert.equal(c("買う", "かう", "v5u", "nai"), "買わない");
  assert.equal(c("話す", "はなす", "v5s", "ta"), "話した");
  assert.equal(c("くださる", "くださる", "v5aru", "request"), "ください");
  assert.equal(c("ござる", "ござる", "v5aru", "mashita"), "ございました");
  assert.equal(c("勉強する", "べんきょうする", "vs-i", "mashou"), "勉強しましょう");
  assert.deepEqual(conjugate("来る", "くる", "vk", "masu"), { surface: "来ます", reading: "きます" });
  assert.deepEqual(conjugate("来る", "くる", "vk", "nai"), { surface: "来ない", reading: "こない" });
  assert.deepEqual(conjugate("来る", "くる", "vk", "te"), { surface: "来て", reading: "きて" });
});
