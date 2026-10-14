# Songbooks interface

User-selected direction: Duolingo-inspired learning UI. Retain existing illustrations, lyrics, pinyin, spelling inputs, audio, and navigation.

Reference: [Duolingo typography guidance](https://design.duolingo.com/identity/typography). Local Nunito fonts provide rounded Latin typography without a runtime network dependency.

White and lightly tinted green surfaces, rounded Nunito typography, green learning progress, large rounded controls with a solid bottom lip. Primary controls use bright green with dark text for contrast. Blue focus outlines indicate keyboard interaction. Correct spelling receives a green underline; active pronunciation receives a pale green fill.

The homepage is a cover collection. Reader pages place lyrics and pinyin inputs above the picture, with Read sentence next to Play this lyric underneath. The progress bar reflects actual page position. There are no synthetic streaks, hearts, or XP counters.

Chinese lyric typography remains large KaiTi with legible Nunito pinyin. The on-screen keyboard's visual viewport determines available height: the illustration shrinks or hides, and the active input stays visible in the internally scrolling reader. Closing the keyboard restores the picture. Short and narrow views allow internal scrolling rather than compressing touch inputs. Touch input text is at least 16px; zoom remains available and does not masquerade as keyboard opening. Reduced-motion preferences suppress page-turn motion.
