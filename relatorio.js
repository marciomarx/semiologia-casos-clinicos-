(() => {
  const section = document.createElement('section');
  section.innerHTML = `<button type="button" id="gerar">Gerar relatório da anamnese</button>
    <div id="relatorio" hidden><h2>Relatório da anamnese</h2><pre style="white-space:pre-wrap;font:inherit"></pre>
    <div class="acoes"><button type="button" id="salvar">Baixar em texto</button>
    <button type="button" id="pdf">Imprimir ou salvar em PDF</button>
    <button type="button" id="enviar">Compartilhar…</button>
    <button type="button" id="email">Enviar por e-mail</button></div></div>`;
  document.querySelector('footer').before(section);
  const panel = section.querySelector('#relatorio');
  const preview = panel.querySelector('pre');
  function generate() {
    calcularPontuacao();
    const items = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    preview.textContent = [document.title, new Date().toLocaleDateString('pt-BR'),
      document.getElementById('resultado').innerText,
      items.filter(item => item.checked).length + ' de ' + items.length + ' itens marcados.',
      '', ...items.map(item => (item.checked ? 'Realizado: ' : 'Não marcado: ') + item.labels[0].textContent.trim())].join('\n');
    panel.hidden = false;
  }
  section.querySelector('#gerar').onclick = generate;
  document.addEventListener('change', event => {
    if (!panel.hidden && event.target.matches('input[type="checkbox"]')) generate();
  });
  section.querySelector('#salvar').onclick = () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + preview.textContent], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = document.title + '.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const sheet = document.createElement('style');
  sheet.textContent = '@media print { body.imprimir-relatorio > :not(.secao-relatorio), .imprimir-relatorio #gerar, .imprimir-relatorio .acoes { display:none !important } }';
  document.head.append(sheet);
  section.className = 'secao-relatorio';
  section.querySelector('#pdf').onclick = () => {
    document.body.classList.add('imprimir-relatorio');
    window.print();
  };
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-relatorio'));
  const share = section.querySelector('#enviar');
  share.hidden = typeof navigator.share !== 'function';
  share.onclick = async () => {
    try { await navigator.share({title:document.title, text:preview.textContent}); }
    catch (error) { if (error.name !== 'AbortError') alert('O compartilhamento está indisponível. Use o e-mail ou baixe o relatório.'); }
  };
  section.querySelector('#email').onclick = () => {
    location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent(preview.textContent);
  };
})();