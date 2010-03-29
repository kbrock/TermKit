(function ($) {

/**
 * Emulates a caret inside a token using an invisible ad-hoc textfield.
 */
termkit.tokenField.caret = function (tokenList) {
  this.tokenList = tokenList;
  
  this.$element = this.$markup;
  this.$input = this.$element.find('input');
  this.$measure = this.$element.find('.measure');
  
  this.token = null;
  this.selection = null;
  
  this.prefix = this.suffix = '';
};

termkit.tokenField.caret.prototype = {
  get $markup() {
    var $caret = $('<span id="caret"><input /><span class="measure"></span></span>');
    var self = this;
    $caret.find('input')
      .keydown(function (e) { self.onKeyDown(e); })
      .keypress(function (e) { self.onKeyPress(e); })
      .blur(function (e) { self.onBlur(); });
    return $caret;
  },

  moveTo: function (selection) {
    $('#debug').append('<div>moving to token ' + selection.anchor.token.contents + ' @ ' + selection.anchor.offset);

    selection.validate();

    $('#debug').append('<div>moving to valid token ' + selection.anchor.token.contents + ' @ ' + selection.anchor.offset);
    
    
    // Ensure caret is cleanly removed from its existing position.
    this.remove();

    this.tokenList.debug();
  
    // Examine target token.
    this.selection = selection;
    var token = selection.anchor.token;
    var $token = token.$element;
    var text = token.contents;

    if (text == '') {
      // Append caret at the end of the token.
      $token.append(this.$element);
      this.$input.focus();
    }
    else {
      this.$input.val(text);

      // Split the text node at the given offset.
      token.$element
        .empty()
        .append(this.prefix)
        .append(this.$element)
        .append(this.suffix);

      this.$input.focus();
      this.$input[0].selectionEnd = this.$input[0].selectionStart = selection.anchor.offset;
    }

    // Prevent token object from updating itself.
    this.token = token;
    this.token.locked = true;

    // Sync state.
    this.updateContents();
  },
  
  remove: function () {
    // Detach caret elements from document.
    this.$element.detach();

    if (!this.token) return;

    // Let token update itself.
    this.token.locked = false;

    // Update token with new combined text value.
    var value = this.prefix + this.$measure.text() + this.suffix;
    if ((value != '') || this.token.allowEmpty) {
      this.token.contents = value;
    }
    else {
      this.tokenList.remove(this.token);
      this.tokenList.refreshField();
    }

    // Reset caret state.
    this.$measure.html('');
    this.$input.val('');
    this.prefix = this.suffix = '';
    this.token = null;
    this.selection = null;
  },

  onBlur: function (element) {
    this.remove();
  },

  onKeyPress: function (event) {
//    async.call(this, function () {
//      this.updateContents();
//    });
  },

  updateContents: function () {
    if (!this.selection) return;
    this.selection.anchor.offset = this.$input[0].selectionStart + this.prefix.length;
    
    var old = this.token;
    this.token.contents = this.prefix + this.$input.val() + this.suffix;

    // Needs to be async, otherwise DOM weirdness occurs??
    async.call(this, function () {
      this.tokenList.onChange(this.token);
    });

    if (old == this.token) {
      this.$measure.text(this.$input.val());
      this.$input.css('width', this.$measure.width() + 20);
    }
  },
  
  onKeyDown: function (event) {
    // Intercept special keys
    switch (event.keyCode) {
      case 37: // Left arrow
        if (this.selection.anchor.offset == 0) {
          async.call(this, function () {
            var selection = this.selection;
            selection.anchor.offset--;
            this.moveTo(selection);
          });
          return;
        }
        break;
      case 39: // Right arrow
        if (this.selection.anchor.offset == this.token.contents.length) {
          async.call(this, function () {
            var selection = this.selection;
            selection.anchor.offset++;
            this.moveTo(selection);
          });
          return;
        }
        break;
    };
    
    async.call(this, function () {
      this.updateContents();
    });
  },

  reset: function () {
    // find caret offset inside textfield
    // calculate length of prefix
    // remove caret
    // insert caret at given pos
  },
  
};

})(jQuery);
