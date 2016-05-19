var rootUrl = "http://122.200.75.13";

function pageClick() {
	var sect = $(this).attr('sect');
	var src = $(this).attr('src');
	var obj = plus.webview.getWebviewById(src);
	if(sect && obj){		
		mui.fire(obj, 'goMark', sect);
	}
	mui.openWindow({
		url: 'page.html',
		id: src,
		extras: {
			src: rootUrl + src,
			section: sect
		}
	});
}

function catalogClick() {	
	mui.openWindow({
		url: 'catalog.html',
		id: $(this).attr('src'),
		extras: {
			src: rootUrl + $(this).attr('src'),
			
		}
	});
}

function localClick() {
	switch ($(this).attr('mod')) {
		case 'home':
			mui.openWindow({
				url: 'index.html',
				id: 'HBuilder'
			});
			break;
		case 'readRecord':
			mui.openWindow({
				url: 'readRecorder.html',
				id: 'readRecord'
			});
			break;
		case 'about':
			mui.openWindow({
				url: 'about.html',
				id: 'about.html'
			});
			break;
		case 'bookMark':
			mui.openWindow({
				url: 'marks.html',
				id: 'marks.html'
			});
			break;
		case 'bookNote':
			mui.openWindow({
				url: 'notes.html',
				id: 'notes.html'
			});
			break;
	}
}

function search() {
	var mod = "";
	if ($('#nameSearch').is(':checked')) {
		mod = "&category=书名";
	}
	var val = $('#searchInput').val();
	mui.openWindow({
		url: 'search.html',
		id: 'search' + val + mod,
		extras: {
			src: rootUrl + "/result.php?query=" + val + mod
		}
	});
	$('#searchInput').blur();
}

function searchNextPage() {
	mui.openWindow({
		url: 'search.html',
		id: $(this).attr('src'),
		extras: {
			src: rootUrl + $(this).attr('src')
		}
	});
}

function makeCatalogLink(a) {
	var h = "<a class='catalogLink link' ";
	h += "src='" + a.attr('href') + "'>";
	h += a.html() + "</a>&nbsp;";
	return h;
}

function makePageLink(a) {
	var h = "<a class='pageLink link' ";
	h += "src='" + a.attr('href') + "'>";
	h += a.html() + "</a>&nbsp;";
	return h;
}

function makePageLinkByRecord(record) {
	var h = "<a class='pageLink link' ";
	var sect = null;
	if(typeof(record.section) != 'undefined'){
		sect = " " + record.page + "页 " + (record.section + 1) + "段";
	}
	h += "src='" + path2page(record.path, record.page) + "'";
	if(sect){
		h += "sect='" + record.section +"'";
	}else{
		sect = "";
	}
	h +=">";	
	h += getBookName(record.path) + sect +"</a>&nbsp;";
	return h;
}

function linkListen() {
	$().ready(function() {
//		mui('body').off('tap', '.pageLink', pageClick);
//		mui('body').off('tap', '.catalogLink', catalogClick);
//		mui('body').off('tap', '.localLink', localClick);
//		mui('body').off('tap', '#searchBtn', search);
		mui('body').on('tap', '.pageLink', pageClick);
		mui('body').on('tap', '.catalogLink', catalogClick);
		mui('body').on('tap', '.localLink', localClick);
		mui('body').on('tap', '#searchBtn', search);
		mui('body').on('tap', '.link', function(){
			$('#searchInput').blur();
		});
	});
}

function makeHeader() {
	var head = $(".breadcrumb");
	head.find("a").each(function() {
		if ($.trim($(this).attr('href')) != "/") {
			$(".mui-bar-nav").append(makeCatalogLink($(this)));
		};
	});
	var p = "";
	if (typeof(pageIdx) != 'undefined' && pageIdx > 1) {
		p = pageIdx;
	}
	$(".mui-bar-nav").append("<span class='title'>" + head.find(".active").html() + "</span> " + p );
	head.remove();
}

function makeFooter(ret) {
	var footer = $("nav .pager");
	ret = {
		last: false,
		next: false
	}
	footer.find("a").each(function() {
		var con = $.trim($(this).html());
		if (con == "下一页") {
			ret.next = true;
			ret.nextA = "<a class='pageLink link' " + "src='" + $(this).attr('href') + "'>" + " [下接第" + (parseInt(pageIdx) + 1) + "页]</a>";
		}
		if (con == "上一页") {
			ret.last = true;
			ret.lastA = "<a class='pageLink link' " + "src='" + $(this).attr('href') + "'>" + " [上接第" + (pageIdx - 1) + "页]</a>";
		}
		$(".mui-bar-tab").append(makePageLink($(this)));
		$(".mui-bar-tab").append("&nbsp;&nbsp;");
	});
	footer.remove();
	return ret;
}

function makeCatalog() {
	$("#prePage").find(".catalog a").each(function() {
		var href = $(this).attr('href');
		var linkReg = /\.html/gi;
		if (linkReg.test(href)) {
			$('#page').append(makePageLink($(this)));
		} else {
			$('#page').append(makeCatalogLink($(this)));
		}
		$('#page').append("<hr>");
	});
}

function makePage(txt) {
	//将每段文字加入一个。section span,并去除多余空行
	txt = getCon(txt);
	var arr = txt.split("<br />");
	var len = arr.length;
	txt = arr[0];
	var brFlag = false;
	for (var i = 1; i < len - 1; i++) {
		//去除连续空行
		if ($.trim(arr[i]) == "") {
			if (brFlag) {
				continue;
			} else {
				brFlag = true;
			}

		} else {
			brFlag = false;
		}
		txt += "<span class='section'><span class=\"section-content\">" + arr[i] + "</span></span><br />";
	}
	txt += arr[len - 1];
	arr = [];
	return txt;
}
function pageReady(){
			plus.ui.createWaiting();
			var self = plus.webview.currentWebview();
			selfObj = self;
			pageIdx = getPageIdx(self.src);
			goMarkIdx = self.section;
			mui.get(self.src, function(txt) {
				pagePath = getName(self.src);
				makeReadRecord(pagePath, pageIdx);
				$("#page").html(makePage(txt));
				txt = "";
				$().ready(function() {
					makeHeader();
					var stat;
					stat = makeFooter(stat);
					if (stat.last) {
						$("#page .container").prepend("<div class='docStat'>" + stat.lastA + "</div>")
					}
					if (stat.next) {
						$("#page .container").append("<div class='docStat'>" + stat.nextA + "</div>")
					} else {
						$("#page .container").append("<div class='docStat'>[完]</div>")
					}
					addMarksAndNotes();
					linkListen();
					plus.nativeUI.closeWaiting();
					$().ready(function() {
						mui('body').on('doubletap', '.section', showList);
						mui('body').on('tap', '#closeList', function() {
							mui('#popover').popover('hide');
						});
						mui('body').on('tap', '#bookMark', makeMark);
						mui('body').on('tap', '#bookNote', makeNote);
						mui('body').on('tap', '#closeNoteMng', function() {
							mui('#noteMng').popover('hide');
						});
						mui('body').on('tap', '#deleteNote', deleteNote);
						mui('body').on('tap', '#editNote', makeNote);
						mui('body').on('tap', '#goTop', function(){
							location.hash = "";
							location.hash = "#pagetop";
						});
						
					});
				});
			});
		}

function getCon(txt) {
	var reg = /<body.*?>([\s\S]*)<\/body>/g;
	var con = reg.exec(txt);
	txt = con[0];
	reg = /<script.*?>[\s\S]*?<\/script\>/g;
	txt = txt.replace(reg, "");
	return txt;
}

function getPageIdx(url) {
	var linkReg = /\-(\d*)\.html/gi;
	var res = linkReg.exec(url);
	if (res == null) {
		return 1;
	} else {
		return res[1];
	}
}

function getName(src) {
	var ret = src.replace(rootUrl + "/", "");
	return ret.replace(/\-*\d*\.html/, "");
}

function getBookName(path) {
	return path.replace(/^.*\//, "");
}

function path2page(path, page) {
	var p = "";
	if (page > 1) {
		p = "-" + page;
	}
	return "/" + path + p + ".html";
}