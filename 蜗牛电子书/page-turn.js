let activeTurn = null;
window.capturePageTurn = direction => {
  activeTurn?.animation.cancel();
  activeTurn?.layer.remove();
  activeTurn = null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const article = document.querySelector('.book-page');
  const illustration = article.querySelector('.illustration');
  const rectangle = illustration.getBoundingClientRect();
  const caption = article.querySelector('.caption');
  const properties = ['display','width','height','min-width','max-width','box-sizing','padding','margin','border','border-top','border-right','border-bottom','border-left','border-radius','outline','appearance','background','color','font','line-height','letter-spacing','text-align','white-space','flex-direction','flex-wrap','align-items','justify-content','gap','object-fit','overflow','ruby-align','fill','stroke','stroke-width'];
  const sheet = document.createElement('div');
  sheet.style.cssText = `position:absolute;left:${rectangle.left}px;top:${rectangle.top}px;width:${rectangle.width}px;background:${getComputedStyle(article).backgroundColor};transform-origin:${direction > 0 ? 'left' : 'right'} center;backface-visibility:hidden;`;
  for (const source of [illustration, caption]) {
    const clone = source.cloneNode(true);
    const originals = [source, ...source.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    originals.forEach((node, index) => {
      const computed = getComputedStyle(node);
      for (const property of properties) copies[index].style.setProperty(property, computed.getPropertyValue(property));
      copies[index].removeAttribute('id');
      if (node.matches('input')) copies[index].value = node.value;
    });
    sheet.append(clone);
  }
  const layer = document.createElement('div');
  layer.className = 'page-turn-layer';
  layer.inert = true;
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:50;';
  layer.attachShadow({mode:'closed'}).append(sheet);
  document.body.append(layer);
  const animation = sheet.animate([
    {transform:'perspective(1800px) rotateY(0deg)',filter:'brightness(1)',boxShadow:'0 4px 12px #52432916'},
    {transform:`perspective(1800px) rotateY(${direction > 0 ? 55 : -55}deg)`,filter:'brightness(.88)',boxShadow:'0 16px 28px #52432935',offset:.6},
    {transform:`perspective(1800px) rotateY(${direction > 0 ? 105 : -105}deg)`,filter:'brightness(.82)',boxShadow:'0 8px 16px #52432916'}
  ],{duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  const turn = {layer, animation};
  activeTurn = turn;
  animation.finished.catch(() => {}).finally(() => {
    layer.remove();
    if (activeTurn === turn) activeTurn = null;
  });
};
