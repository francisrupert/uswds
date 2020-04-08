const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const assert = require('assert');
const ComboBox = require('../../../src/js/components/combo-box');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '/template.html'));

const EVENTS = {};

/**
 * send a click event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.click = (el) => {
  const evt = new MouseEvent('click', {
    view: el.ownerDocument.defaultView,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};

/**
 * send a focusout event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.focusout = (el) => {
  const evt = new Event('focusout', {
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};

/**
 * send a keyup A event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.keyupA = (el) => {
  const evt = new KeyboardEvent('keyup', {
    bubbles: true,
    key: 'a',
    keyCode: 65,
  });
  el.dispatchEvent(evt);
};

/**
 * send a keyup O event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.keyupO = (el) => {
  const evt = new KeyboardEvent('keyup', {
    bubbles: true,
    key: 'o',
    keyCode: 79,
  });
  el.dispatchEvent(evt);
};

/**
 * send a keydown Enter event
 * @param {HTMLElement} el the element to sent the event to
  * @returns {{preventDefaultSpy: sinon.SinonSpy<[], void>}}
 */
EVENTS.keydownEnter = (el) => {
  const evt = new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Enter',
    keyCode: 13,
  });
  const preventDefaultSpy = sinon.spy(evt, 'preventDefault');
  el.dispatchEvent(evt);
  return { preventDefaultSpy };
};

/**
 * send a keydown Escape event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.keydownEscape = (el) => {
  const evt = new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Escape',
    keyCode: 27,
  });
  el.dispatchEvent(evt);
};

/**
 * send a keydown ArrowDown event
 * @param {HTMLElement} el the element to sent the event to
 */
EVENTS.keydownArrowDown = (el) => {
  const evt = new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'ArrowDown',
  });
  el.dispatchEvent(evt);
};

describe('combo box component', () => {
  const { body } = document;

  let root;
  let input;
  let select;
  let list;

  beforeEach(() => {
    body.innerHTML = TEMPLATE;
    ComboBox.on();
    root = body.querySelector('.usa-combo-box');
    input = root.querySelector('.usa-combo-box__input');
    select = root.querySelector('.usa-combo-box__select');
    list = root.querySelector('.usa-combo-box__list');
  });

  afterEach(() => {
    body.textContent = '';
    ComboBox.off(body);
  });

  it('enchaces a select element into a combo box component', () => {
    assert.ok(input, 'adds an input element');
    assert.ok(select.classList.contains('usa-sr-only'), 'hides the select element from view');
    assert.ok(list, 'adds an list element');
    assert.ok(list.hidden, 'the list is hidden');
    assert.equal(select.getAttribute('id'), '', 'transfers id attribute to combobox');
    assert.equal(input.getAttribute('id'), 'combobox', 'transfers id attribute to combobox');
    assert.equal(select.getAttribute('required'), null, 'transfers required attribute to combobox');
    assert.equal(input.getAttribute('required'), '', 'transfers required attribute to combobox');
    assert.equal(select.getAttribute('name'), 'combobox', 'should not transfer name attribute to combobox');
    assert.equal(input.getAttribute('name'), null, 'should not transfer name attribute to combobox');
    assert.equal(list.getAttribute('role'), 'listbox', 'the list should have a role of `listbox`');
    assert.ok(select.getAttribute('aria-hidden'), 'the select should be hidden from screen readers');
    assert.equal(select.getAttribute('tabindex'), '-1', 'the select should be hidden from keyboard navigation');
  });

  it('should show the list by clicking the input', () => {
    EVENTS.click(input);

    assert.ok(list && !list.hidden, 'should display the option list');
    assert.equal(
      list.children.length,
      select.options.length - 1,
      'should have all of the initial select items in the list except placeholder empty items',
    );
  });

  it('should show the list by clicking when clicking the input twice', () => {
    EVENTS.click(input);
    EVENTS.click(input);

    assert.ok(list && !list.hidden, 'should keep the option list displayed');
    assert.equal(
      list.children.length,
      select.options.length - 1,
      'should have all of the initial select items in the list except placeholder empty items',
    );
  });

  it('should set up the list items for accessibilty', () => {
    EVENTS.click(input);

    for (let i = 0, len = list.children.length; i < len; i += 1) {
      assert.equal(
        list.children[i].getAttribute('aria-selected'),
        'false',
        `item ${i} should not be shown as selected`,
      );
      assert.equal(
        list.children[i].getAttribute('tabindex'),
        '-1',
        `item ${i} should be hidden from keyboard navigation`,
      );
      assert.equal(
        list.children[i].getAttribute('role'),
        'option',
        `item ${i} should have a role of 'option'`,
      );
    }
  });

  it('should close the list by clicking away', () => {
    EVENTS.click(input);
    EVENTS.focusout(input);

    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.ok(list.hidden, 'should hide the option list');
  });

  it('should select an item from the option list when clicking a list option', () => {
    EVENTS.click(input);
    EVENTS.click(list.children[0]);

    assert.equal(select.value, 'value-ActionScript', 'should set that item to being the select option');
    assert.equal(input.value, 'ActionScript', 'should set that item to being the input value');
    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
  });

  it('should display and filter the option list after a character is typed', () => {
    input.value = 'a';

    EVENTS.keyupA(input);

    assert.ok(list && !list.hidden, 'should display the option list');
    assert.equal(list.children.length, 10, 'should filter the item by the string being present in the option');
  });

  it('should clear input values when an incomplete item is remaining on blur', () => {
    select.value = 'value-ActionScript';
    input.value = 'a';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    EVENTS.focusout(input);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, '', 'should clear the value on the select');
    assert.equal(input.value, '', 'should clear the value on the input');
  });

  it('should clear input values when an incomplete item is submitted through enter', () => {
    select.value = 'value-ActionScript';
    input.value = 'a';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    const { preventDefaultSpy } = EVENTS.keydownEnter(input);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, '', 'should clear the value on the select');
    assert.equal(input.value, '', 'should clear the value on the input');
    assert.ok(preventDefaultSpy.called, 'should not have allowed enter to propagate');
  });

  it('should allow enter to propagate when the list is hidden', () => {
    const { preventDefaultSpy } = EVENTS.keydownEnter(input);

    assert.ok(list.hidden, 'the list is hidden');
    assert.ok(preventDefaultSpy.notCalled, 'should allow event to perform default action');
  });

  it('should close the list but not the clear input values when escape is performed while the list is open', () => {
    select.value = 'value-ActionScript';
    input.value = 'a';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    EVENTS.keydownEscape(input);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, 'value-ActionScript', 'should not change the value of the select');
    assert.equal(input.value, 'a', 'should not change the value in the input');
  });

  it('should set input values when an complete item is submitted by clicking away', () => {
    select.value = 'value-ActionScript';
    input.value = 'go';

    EVENTS.keyupO(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    EVENTS.focusout(input);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, 'value-Go', 'should set that item to being the select option');
    assert.equal(input.value, 'Go', 'should set that item to being the input value');
  });

  it('should set input values when an complete item is submitted by pressing enter', () => {
    select.value = 'value-ActionScript';
    input.value = 'go';

    EVENTS.keyupO(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    EVENTS.keydownEnter(input);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, 'value-Go', 'should set that item to being the select option');
    assert.equal(input.value, 'Go', 'should set that item to being the input value');
  });

  it('should show the no results item when a nonexistent option is typed', () => {
    input.value = 'Bibbidi-Bobbidi-Boo';

    EVENTS.keyupO(input);

    assert.ok(list && !list.hidden, 'should display the option list');
    assert.equal(list.children.length, 1, 'should show no results list item');
    assert.equal(list.children[0].textContent, 'No results found', 'should show no results list item');
  });

  it('should focus the first item in the list when pressing down from the input', () => {
    input.value = 'la';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    assert.equal(list.children.length, 2, 'should filter the item by the string being present in the option');
    EVENTS.keydownArrowDown(input);
    const focusedOption = document.activeElement;

    assert.ok(focusedOption.classList.contains('usa-combo-box__list-option--focused'), 'should focus the first item in the list');
    assert.equal(focusedOption.textContent, 'Erlang', 'should focus the first item in the list');
  });

  it('should select the focused list item in the list when pressing enter on a focused item', () => {
    select.value = 'value-JavaScript';
    input.value = 'la';

    EVENTS.keyupA(input);
    EVENTS.keydownArrowDown(input);
    const focusedOption = document.activeElement;
    assert.equal(focusedOption.textContent, 'Erlang', 'should focus the first item in the list');
    EVENTS.keydownEnter(focusedOption);

    assert.equal(select.value, 'value-Erlang', 'select the first item in the list');
    assert.equal(input.value, 'Erlang', 'should set the value in the input');
  });

  it('should focus the last item in the list when pressing down many times from the input', () => {
    input.value = 'la';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden, 'should display the option list');
    assert.equal(list.children.length, 2, 'should filter the item by the string being present in the option');
    EVENTS.keydownArrowDown(input);
    EVENTS.keydownArrowDown(input);
    EVENTS.keydownArrowDown(input);
    const focusedOption = document.activeElement;

    assert.ok(focusedOption.classList.contains('usa-combo-box__list-option--focused'), 'should focus the first item in the list');
    assert.equal(focusedOption.textContent, 'Scala', 'should focus the last item in the list');
  });

  it('should not select the focused item in the list when pressing escape from the focused item', () => {
    select.value = 'value-JavaScript';
    input.value = 'la';

    EVENTS.keyupA(input);
    assert.ok(list && !list.hidden && list.children.length, 'should display the option list with options');
    EVENTS.keydownArrowDown(input);
    const focusedOption = document.activeElement;
    assert.equal(focusedOption.textContent, 'Erlang', 'should focus the first item in the list');
    EVENTS.keydownEscape(focusedOption);

    assert.ok(list.hidden, 'should hide the option list');
    assert.equal(list.children.length, 0, 'should empty the option list');
    assert.equal(select.value, 'value-JavaScript', 'should not change the value of the select');
    assert.equal(input.value, 'la', 'should not change the value in the input');
  });
});
