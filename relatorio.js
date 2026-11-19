(() => {
  const field = (tag, value) => {
    const el = document.createElement(tag);
    el.textContent = value;
    return el;
  };
  const team = document.createElement('fieldset');
  team.className = 'dupla';
  team.innerHTML = '<legend>Identificação da dupla</legend><label>Estudante no papel de farmacêutico(a)<input required maxlength="120" autocomplete="off"></label><label>Estudante no papel de paciente<input required maxlength="120" autocomplete="off"></label>';
  document.querySelector('h2').before(team);
  const names = [...team.querySelectorAll('input')];
  const stages = [...document.querySelectorAll('.checkpoint')].map(box => {
    const check = box.querySelector('input[type=checkbox]');
    const criterion = check.labels[0].textContent.trim();
    let sibling = box.previousElementSibling;
    let expected = '';
    while (sibling && sibling.tagName !== 'H3') {
      const key = sibling.querySelector('strong')?.textContent || '';
      if (/Pergunta esperada|Problema a ser identificado/i.test(key)) expected = sibling.textContent.trim();
      sibling = sibling.previousElementSibling;
    }
    const title = sibling.textContent.trim().replace(/:$/, '');
    const label = field('label', 'Avaliação da etapa ');
    const status = document.createElement('select');
    ['Sem avaliação','Realizada corretamente','Realizada com erro','Não realizada'].forEach(value => status.add(new Option(value, value)));
    status.selectedIndex = check.checked ? 1 : 0;
    label.append(status);
    const noteLabel = field('label','Observação sobre a atuação ');
    const note = document.createElement('textarea');
    note.rows = 2;
    note.placeholder = 'Opcional. Registre a pergunta feita, o acerto ou o que precisa ser corrigido.';
    noteLabel.append(note);
    const details = document.createElement('details');
    details.append(field('summary','Detalhar a avaliação desta etapa'), label, noteLabel);
    box.append(details);
    status.onchange = () => { check.checked = status.selectedIndex === 1; };
    check.onchange = () => { status.selectedIndex = check.checked ? 1 : 0; };
    return {title, criterion, expected, status, note};
  });
  const section = document.createElement('section');
  section.innerHTML = `<button type="button" id="gerar">Gerar relatório da anamnese</button>
    <div id="relatorio" hidden><h2>Relatório da anamnese</h2><article></article>
    <div class="acoes"><button type="button" id="salvar">Baixar em texto</button>
    <button type="button" id="pdf">Imprimir ou salvar em PDF</button>
    <button type="button" id="enviar">Compartilhar…</button>
    <button type="button" id="email">Enviar por e-mail</button></div></div>`;
  document.querySelector('footer').before(section);
  const panel = section.querySelector('#relatorio');
  const preview = panel.querySelector('article');
  function generate() {
    for (const name of names) {
      if (!name.value.trim()) {
        panel.hidden = true;
        name.setCustomValidity('Informe o nome do estudante.');
        name.reportValidity();
        name.focus();
        return;
      }
    }
    calcularPontuacao();
    const counts = [0,0,0,0];
    stages.forEach(stage => counts[stage.status.selectedIndex]++);
    preview.replaceChildren(field('h3',document.title), field('p','Data da simulação: ' + new Date().toLocaleDateString('pt-BR')),
      field('p','Farmacêutico(a): ' + names[0].value.trim()),field('p','Paciente (estudante): ' + names[1].value.trim()),
      field('h3','Desempenho na entrevista'),field('p',document.querySelector('#resultado').innerText),
      field('p',counts[1] + ' corretas · ' + counts[2] + ' com erro · ' + counts[3] + ' não realizadas · ' + counts[0] + ' sem avaliação'));
    stages.forEach(({title,criterion,expected,status,note}) => {
      const block = document.createElement('div');
      block.className = 'etapa';
      block.append(field('h4',title + ' · ' + status.value),field('p','Critério: ' + criterion));
      if (expected) block.append(field('p',expected));
      if (note.value.trim()) block.append(field('p','Observação: ' + note.value.trim()));
      preview.append(block);
    });
    panel.hidden = false;
  }
  section.querySelector('#gerar').onclick = generate;
  names.forEach(name => name.addEventListener('input', () => {
    name.setCustomValidity('');
    panel.hidden = true;
  }));
  document.addEventListener('input', event => {
    if (!panel.hidden && event.target.matches('.checkpoint textarea')) generate();
  });
  document.addEventListener('change', event => {
    if (!panel.hidden && event.target.closest('.checkpoint')) generate();
  });
  section.querySelector('#salvar').onclick = () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + preview.innerText], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = names[0].value.trim() + ' - ' + document.title + '.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const sheet = document.createElement('style');
  sheet.textContent = '.dupla,.secao-relatorio article{border:1px solid #b7c8d2;border-radius:8px;padding:1rem;margin:1rem 0}.dupla label,.checkpoint details label{display:block;margin:.65rem 0}.dupla input,.checkpoint textarea,.checkpoint select{display:block;box-sizing:border-box;width:min(100%,38rem);padding:.5rem;font:inherit}.checkpoint summary{cursor:pointer}.etapa{border-top:1px solid #b7c8d2;padding:.5rem 0;break-inside:avoid}.etapa h4,.etapa p,.secao-relatorio article>p{margin:.3rem 0}.secao-relatorio article{overflow-wrap:anywhere}.secao-relatorio h3{color:#184461}@page{size:A4;margin:16mm}@media print{body.imprimir-relatorio{background:white;color:black;margin:0;padding:0;font:10pt/1.35 Arial}.imprimir-relatorio article{border:0;padding:0}.imprimir-relatorio h2,.imprimir-relatorio h3{break-after:avoid}} @media print { body.imprimir-relatorio > :not(.secao-relatorio), .imprimir-relatorio #gerar, .imprimir-relatorio .acoes { display:none !important } }';
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
    try { await navigator.share({title:document.title, text:preview.innerText}); }
    catch (error) { if (error.name !== 'AbortError') alert('O compartilhamento está indisponível. Use o e-mail ou baixe o relatório.'); }
  };
  section.querySelector('#email').onclick = () => {
    location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent(preview.innerText);
  };
})();