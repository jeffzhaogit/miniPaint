import config from './../../config.js';
import File_open_class from './open.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Helper_class from './../../libs/helpers.js';

/** 
 * manages image search on https://pixabay.com/en/service/about/api/
 */
class File_search_media_class {

	constructor() {
		this.File_open = new File_open_class();
		this.POP = new Dialog_class();
                this.Helper = new Helper_class();
		this.cache = [];
                this.set_events();
                
                this.uid = this.Helper.get_url_parameters().uid || 0;
	}
        
        set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code === 81) {
				_this.search('', [], 0);
				event.preventDefault();
			}
		}, false);
	}
        
        searchSystem(query = '', data = []) {
            this.search('', data, 0);
        }
        
        searchPersonal(query = '', data = []) {
            this.search('', data, 1);
        }

	/**
	 * Image search apiq
	 * 
	 * @param {string} query
	 * @param {array} data
	 */
	search(query = '', data = [], source = 1) {
		var _this = this;
		var html = '';
                
		if (data.length > 0) {
			for (var i in data) {
				html += '<div class="item pointer">';
				html += '<img class="displayBlock" alt="" src="' + data[i].url + '" data-url="' + data[i].url + '" />';
				html += '</div>';
			}
			//fix for last line
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
		}

		var settings = {
			title: 'Search',
			comment: source === 1 ? '来源: <span style="color:green">个人图库</span>' : '来源: <span style="color:green">楷课图库</span>',
			className: 'wide',
			params: [
				{name: "query", title: "Keyword:", value: query},
			],
			on_load: function (params) {
				var node = document.createElement("div");
				node.classList.add('flex-container');
				node.innerHTML = html;
				document.querySelector('#popup #dialog_content').appendChild(node);
				//events
				var targets = document.querySelectorAll('#popup .item img');
				for (var i = 0; i < targets.length; i++) {
					targets[i].addEventListener('click', function (event) {
						//we have click
						window.State.save();
						this.dataset.url = this.dataset.url.replace('_640.', '_960.');
						var data = {
							url: this.dataset.url,
						};
						_this.File_open.file_open_url_handler(data);
					});
				}
			},
			on_finish: function (params) {
				if (params.query == '')
					return;

				if (_this.cache[source + '_' + params.query] != undefined) {
					//using cache

					setTimeout(function () {
						//only call same function after all handlers finishes
						var data = _this.cache[source + '_' + params.query];
						if (data.length === 0) {
							alertify.error('没有找到任何图片，请重新指定关键字查询。');
						}
						_this.search(params.query, data, source);
					}, 100);
				}
				else {
					//query to service
					var URL = config.fileServiceUrl + '/tag/' + encodeURIComponent((source === 1? ('个人图库,' + _this.uid + ',+') : '楷课图库,+') + params.query) + "?limit=50";
					$.getJSON(URL, function (data) {
						_this.cache[source + '_' + params.query] = data;

						if (data.length === 0) {
							alertify.error('没有找到任何图片，请重新指定关键字查询。');
						}
						_this.search(params.query, data, source);
					})
						.fail(function () {
							alertify.error('Error connecting to service.');
						});
				}
			},
		};
		this.POP.show(settings);
	}

}

export default File_search_media_class;

