/********* public *****************/
function getLocalTime(nS) {
	return new Date(parseInt(nS) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ');
}
function timestemp(){
	return Date.parse(new Date()) / 1000;
}

var readRecorder = new dataBase('readRecorder', 'reader', 2);
var bookMark = new dataBase('bookMark', 'reader', 2);
var bookNote = new dataBase('note', 'reader', 2);
var downLoad = new dataBase('downLoad', 'reader', 2);
function showList(){
	mui('#popover').popover('show');
	sectionIdx = $(this).index('.section');
}

function initDatabase() {
	var frecord = {
		path: 'TEXT',
		page: 'INTEGER',
		date: 'INTEGER'
	}
	readRecorder.create(frecord, lastReadRecord);
	var fmark = {
		path: 'TEXT',
		page: 'INTEGER',
		section: 'INTEGER',
		date: 'INTEGER'
	}
	bookMark.create(fmark);
	var fnote = {
		path: 'TEXT',
		page: 'INTEGER',
		section: 'INTEGER',
		note: 'TEXT',
		date: 'INTEGER'
	}
	bookNote.create(fnote);
	var fdown = {
		path: 'TEXT',
		process: 'INTEGER',
		date: 'INTEGER'
	}
	bookNote.create(fnote);
}


/********* readRecord *****************/
function lastReadRecord() {
				readRecorder.count(function(num) {
					if (num > 0) {
						var sql = "select path, page from " + readRecorder.table + " order by `date` desc limit 0,1";
						readRecorder.query(sql, function(res) {
							var t = res.rows.item(0);
							$('#lastRecord').html(getBookName(t.path));
							$('#lastRecord').attr('src', path2page(t.path, t.page));
							$('#recentRead').show();
						});
					}
				});
			}
function recordRefresh() {
	mui.fire(plus.webview.getWebviewById('HBuilder'), 'recordRefresh');
	mui.fire(plus.webview.getWebviewById('readRecord'), 'recordRefresh');
}
function makeReadRecord(path, page) {
	readRecorder.count({
		path: path
	}, function(num) {
		var date =  timestemp();
		if (num == 0) {
			readRecorder.insert({
				path: path,
				page: page,
				date: date
			}, recordRefresh);
		} else {
			readRecorder.update({
					page: page,
					date: date
				}, {
					path: path
				},
				recordRefresh
			);
		}
	});

}
function getReadRecord() {
	readRecorder.count(function(num) {
		if (num > 0) {
			readRecorder.select(['path', 'page', 'date'], "1 order by `date` desc", function(res) {
				var len = res.rows.length;
				var txt = "";
				for (var i = 0; i < len; i++) {
					txt += "<div>" + makePageLinkByRecord(res.rows.item(i));
					txt += "<span class='date mui-pull-right'>" + getLocalTime(res.rows.item(i).date) + "</span></div><hr>";
				}
				$('.mui-content').html(txt);
				linkListen();
			});
		} else {
			$('.mui-content').html("<br><div class=\"alert alert-info appIllustrate\">还没有阅读记录</a>");
		}
	});
}


/********* bookMark *****************/
function goMark(section){
	location.hash="#s" + section; 
}
function markReady(){
	$().ready(function(){
		mui("body").on("tap", ".bookmark", deleteMark);
	});
}
function showMark(section){
	var obj = $($(".section").get(section));
	obj.prepend("<a name='s" + section +"' sidx='"
		+ section +"' class='bookmark glyphicon glyphicon-tag'></a>" );	
}
function refreshMarkPage(){
	mui.fire(plus.webview.getWebviewById("marks.html"), 'markPageRefresh');
}
function deleteMark(){
	var sIdx = $(this).attr('sidx');
	$(this).remove();
	mui.toast("已删除书签");
	bookMark.delete({path:pagePath, page:pageIdx, section:sIdx},refreshMarkPage);	
}
function makeMark(){
	var obj = $($(".section").get(sectionIdx)).find('.mark');
	if(obj.length == 0){
		bookMark.insert({path:pagePath, page:pageIdx, section:sectionIdx, date:timestemp()},function(){
			showMark(sectionIdx);
			markReady();
			refreshMarkPage();
		});
		mui.toast("已加入书签");
	}else{
		mui.toast("此段落已存在一个书签");
	}
	mui('#popover').popover('hide');
	
}
function addMarks(){
	bookMark.select(['section'],{path:pagePath,page:pageIdx}, function(res){
		var len = res.rows.length;
		for(var i = 0 ; i < len; i++){
			showMark(res.rows.item(i).section);
		}
		markReady();
	});
}
function removeMark(){
	var markObj = $(this);
	bookMark.delete({
		path:markObj.attr('path'), 
		page:markObj.attr('page'), 
		section:markObj.attr('section')
	}, function(){
		var obj = markObj.parents(".listLine");
		var id = obj.find(".pageLink").attr('src');
		mui.fire(plus.webview.getWebviewById(id), 'markRefresh');
		obj .remove();
	});
	
}
function getMarks(){
	bookMark.count(function(num) {
		if (num > 0) {
			bookMark.select(['path', 'page', 'section', 'date'], "1 order by id desc", function(res) {
				var len = res.rows.length;
				var txt = "";
				for (var i = 0; i < len; i++) {
					var obj = res.rows.item(i);
					txt += "<div class=\"listLine\">"
						+  makePageLinkByRecord(obj)
						+ "<span class=\"mui-pull-right\">"
						+"<span class=\"glyphicon glyphicon-remove-sign removeTag\" "
						+ " path=\"" + obj.path +"\""
						+ "page=\"" + obj.page + "\""
						+ "section=\"" + obj.section +"\""
						+ ">&nbsp;</span>"
						+ "<span class='date'>" + getLocalTime(obj.date)
						+ "</span></span><hr></div>";
				}
				$('.mui-content').html(txt);
				$().ready(function(){
					mui("body").on('tap', '.removeTag', removeMark);
				});
				linkListen();
			});
		} else {
			var info = "<br><div class=\"panel panel-info appIllustrate\"><div class=\"panel-heading \">"
      			+ "<h3 class=\"panel-title\">还没有加入书签</div><div class=\"panel-body\">"
      			+ "<h5><b>加入标书签方法</b>  <h5><p>阅读到某一段落时，长按该段文字（按触屏幕约1秒)，然后在弹出菜单中选择\"书签\"选项。</p>"
      			+ "</div></div>";				
			$('.mui-content').html(info);
		}
	});
}


function makeNote(){
}
