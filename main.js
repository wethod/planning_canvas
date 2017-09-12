var Layout = Marionette.LayoutView.extend({
    el: '[data-region="body"]',
    template: '#bodyLayout',
    _canvas: null,
    _tiles: [],
    _size: 35,
    _margin: 5,
    _outerSize: 40,
    _isErasing: false,
    _forceRow: true,
    _canvasSize: 1800,
    _tilesPerRow: 45, // (_canvasSize / _outerSize)
    _lastPos: {},
    ui: {
        canvas: '[data-region="canvas"]',
        canvasUpper: '[data-region="canvasUpper"]',
        fill: '[data-region="fill"]',
        forceRow: '[data-region="forceRow"]',
        showHide: '[data-region="showHide"]',
    },
    events: {
        'mousedown @ui.canvasUpper': 'listenMove',
        'mouseup @ui.canvasUpper': 'stopListeningMove',
        'mouseout @ui.canvasUpper': 'stopListeningMove',
        'click @ui.fill': 'fill',
        'click @ui.forceRow': 'forceRow',
        'click @ui.showHide': 'showHideElement',
    },
    onRender: function() {
        this._canvas = this.ui.canvas[0].getContext('2d');
        this._canvasUpper = this.ui.canvasUpper[0].getContext('2d');
        var ratio = window.devicePixelRatio;

        this._canvasUpper.canvas.style.width = this._canvas.canvas.width + "px";
        this._canvasUpper.canvas.style.height = this._canvas.canvas.height + "px";

        this._canvasUpper.canvas.width = this._canvas.canvas.width * ratio;
        this._canvasUpper.canvas.height = this._canvas.canvas.height * ratio;

        this._canvasUpper.scale(ratio, ratio);

        this._canvas.font = '10px serif';
        this._canvas.font = 'top';
        this._canvasUpper.fillStyle = 'white';

        this.fill();
        this.onScroll();

        $(window).on('scroll', this.onScroll.bind(this));
    },
    listenMove: function(event) {
        var pos = this.getCoordinatesFromEvent(event);
        this.setErasing(pos);
        this.ui.canvasUpper.on('mousemove', this.onMouseMove.bind(this));
        this.onMouseMove(event);
    },
    stopListeningMove: function() {
        this.ui.canvasUpper.off('mousemove');
        this._isErasing = false;
        this._lastPos = {};
    },
    onMouseMove: function(event) {
        var pos = this.getCoordinatesFromEvent(event);

        if(this._forceRow && this.rawChanged(pos)) {
            return;
        }

        this._lastPos = pos;

        if(this._isErasing) {
            this.erase(pos);
        } else if(!this.tileExist(pos)){
            this.draw(pos);
        }
    },
    erase: function(pos) {
        this._canvas.clearRect(pos.x, pos.y, this._size, this._size);
        this._tiles[pos.x][pos.y] = null;
    },
    draw: function(pos) {
        var color = this.getRandomColor();
        this.drawTile(pos, color);
        this.addTiles(pos, color);
        this.drawText(pos, color);
    },
    tileExist: function(pos) {
        return this._tiles[pos.x] && this._tiles[pos.x][pos.y];
    },
    drawTile: function(pos, color) {
        this._canvas.fillStyle = color;
        this._canvas.fillRect(pos.x, pos.y, this._size, this._size);
    },
    drawText: function(pos, color) {
        this._canvasUpper.clearRect(pos.x, pos.y, this._size, this._size);
        this._canvasUpper.fillText(Math.round(Math.random() * 100), pos.x + 6, pos.y + 16, this._size);
    },
    getCoordinatesFromEvent(event) {
        var canvasLeft = event.currentTarget.offsetLeft;
        var canvasTop = event.currentTarget.offsetTop;

        var clickLeft = event.pageX;
        var clickTop = event.pageY;

        var clickMapLeft = clickLeft - canvasLeft;
        var clickMapTop = clickTop - canvasTop;

        var targetX = Math.floor(clickMapLeft / this._outerSize) * this._outerSize;
        var targetY = Math.floor(clickMapTop / this._outerSize) * this._outerSize;

        return {x: targetX, y: targetY};
    },
    fill: function() {
        for (var i = 0; i < (this._tilesPerRow * this._tilesPerRow); i++) { // 6 months with 50 employees are 12000 blocks
            var x = this._outerSize * (i % this._tilesPerRow);
            var y = Math.floor((this._outerSize * i) / this._canvasSize) * this._outerSize;
            this.draw({x:x, y:y});
        }
    },
    forceRow: function() {
        this._forceRow = !this._forceRow;
    },
    rawChanged: function(pos) {
        return this._lastPos.y && this._lastPos.y != pos.y;
    },
    setErasing: function(pos) {
        this._isErasing = this._tiles[pos.x] && this._tiles[pos.x][pos.y];
    },
    addTiles: function(pos, color) {
        if(!this._tiles[pos.x]) {
            this._tiles[pos.x] = [];
        }
        this._tiles[pos.x][pos.y] = {color: color, x: pos.x, y: pos.y};
    },
    getRandomColor: function() {
        return '#' + Math.round(Math.random() * 999999); // random color up to #999999
    },
    onScroll: function() {
        if(this.isElementVisible()){
            this.showElement();
        } else {
            this.hideElement();
        }
    },
    showHideElement: function() {
        if(this.ui.canvas.css('visibility') == 'visible') {
            this.ui.canvas.css('visibility', 'hidden');
            this.ui.canvasUpper.css('visibility', 'hidden');
        } else {
            this.ui.canvas.css('visibility', 'visible');
            this.ui.canvasUpper.css('visibility', 'visible');
        }
    },
    showElement: function() {
        this.ui.canvas.css('visibility', 'visible');
        this.ui.canvasUpper.css('visibility', 'visible');
    },
    hideElement: function() {
        this.ui.canvas.css('visibility', 'hidden');
        this.ui.canvasUpper.css('visibility', 'hidden');
    },
    isElementVisible: function(event) {
        var canvasLeft = this.$el[0].getBoundingClientRect().left;
        var canvasTop = this.$el[0].getBoundingClientRect().top;
        var canvasHeight = this.ui.canvas.height();
        var canvasWidth = this.ui.canvas.width();

        var windowHeight = (window.innerHeight || document.documentElement.clientHeight);
        var windowWidth = (window.innerWidth || document.documentElement.clientWidth);
        var vertInView = (canvasTop <= windowHeight) && ((canvasTop + canvasHeight) >= 0);
        var horInView = (canvasLeft <= windowWidth) && ((canvasLeft + canvasWidth) >= 0);

        return (vertInView && horInView);
    }
});

var Layout2 = Layout.extend({el: '[data-region="body2"]'});

var Layout3 = Layout.extend({el: '[data-region="body3"]'});

var Layout4 = Layout.extend({el: '[data-region="body4"]'});

var Layout5 = Layout.extend({el: '[data-region="body5"]'});

var Layout6 = Layout.extend({el: '[data-region="body6"]'});

var App = Marionette.Application.extend({
  onStart() {
    var layout = new Layout();
    layout.render();

    var layout2 = new Layout2();
    layout2.render();

    var layout3 = new Layout3();
    layout3.render();

    var layout4 = new Layout4();
    layout4.render();

    var layout5 = new Layout5();
    layout5.render();

    var layout6 = new Layout6();
    layout6.render();
  }
});

var app = new App();
app.start();
