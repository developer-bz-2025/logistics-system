/* @ds-bundle: {"format":4,"namespace":"BZ","components":[{"name":"Button"},{"name":"Logo"},{"name":"SectionRail"},{"name":"Note"},{"name":"TextField"}]} */
(function(){
  var React = window.React, h = React.createElement;
  function cx(){ return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  var LOGOS = {
    'horizontal-light': 'assets/logos/bz-logo-horizontal-color.svg',
    'horizontal-dark': 'assets/logos/bz-logo-horizontal-white.svg',
    'vertical-light': 'assets/logos/bz-logo-vertical-color.svg',
    'vertical-dark': 'assets/logos/bz-logo-vertical-white.svg',
    'mark-light': 'assets/logos/bz-mark-burgundy.svg',
    'mark-dark': 'assets/logos/bz-mark-white.svg'
  };
  function Button(p){
    var variant = p.variant || 'primary';
    var rest = Object.assign({}, p); delete rest.variant; delete rest.className; delete rest.children;
    return h('button', Object.assign({ type: 'button' }, rest, { className: cx('bz-btn', variant === 'compact' ? 'bz-btn-primary' : null, 'bz-btn-' + variant, p.className) }), p.children);
  }
  function Logo(p){
    var layout = p.layout || 'horizontal', on = p.on || 'light';
    var src = p.src || LOGOS[layout + '-' + on];
    return h('img', { src: src, alt: p.alt || 'Basmeh & Zeitooneh, Relief & Development', className: cx('bz-logo', 'bz-logo-' + layout, p.className), style: p.height ? { height: p.height } : undefined });
  }
  function SectionRail(p){
    return h('div', { className: cx('bz-rail', p.className) },
      h('div', { className: 'bz-rail-side', 'aria-hidden': 'true' }, h('span', { className: 'bz-rail-rule' }), h('span', { className: 'bz-rail-label rail' }, p.label), h('span', { className: 'bz-rail-rule bz-rail-rule-grow' })),
      h('div', { className: 'bz-rail-body' }, p.children));
  }
  function Note(p){
    return h('aside', { className: cx('bz-note', 'caption', p.className) }, p.title ? h('strong', { className: 'bz-note-title' }, p.title + ' ') : null, p.children);
  }
  function TextField(p){
    var rest = Object.assign({}, p); delete rest.label; delete rest.className; delete rest.id;
    var id = p.id || ('bz-f-' + (p.name || 'field'));
    return h('div', { className: cx('bz-field', p.className) },
      p.label ? h('label', { htmlFor: id, className: 'bz-field-label' }, p.label) : null,
      h('input', Object.assign({ type: 'text' }, rest, { id: id, className: 'bz-input' })));
  }
  window.BZ = Object.assign(window.BZ || {}, { Button: Button, Logo: Logo, SectionRail: SectionRail, Note: Note, TextField: TextField, logoSources: LOGOS });
})();
