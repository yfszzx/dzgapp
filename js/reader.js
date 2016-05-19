/********* public *****************/
function getLocalTime(nS) {
	return new Date(parseInt(nS) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ');
}

function timestemp() {
	return Date.parse(new Date()) / 1000;
}

var readRecorder = new dataBase('readRecorder', 'reader', 2, "1.0");
var bookMark = new dataBase('bookMark', 'reader', 2, "1.0");
var bookNote = new dataBase('note', 'reader', 2, "1.0");
var downLoad = new dataBase('downLoad', 'reader', 2, "1.0");

function showList() {
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
//	var fdown = {
//		path: 'TEXT',
//		process: 'INTEGER',
//		date: 'INTEGER'
//	}
//	bookNote.create(fdown);
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
		var date = timestemp();
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

function addMarksAndNotes() {
	bookMark.select(['section'], {
		path: pagePath,
		page: pageIdx
	}, function(res) {
		var len = res.rows.length;
		for (var i = 0; i < len; i++) {
			showMark(res.rows.item(i).section);
		}
		bookNote.select(['section', 'note'], {
			path: pagePath,
			page: pageIdx
		}, function(res) {
			var len = res.rows.length;
			for (var i = 0; i < len; i++) {
				var obj = res.rows.item(i);
				showNote(obj.section, obj.note);
			}
			marksAndNotesReady();
		});
	});
}

function marksAndNotesReady() {
	$().ready(function() {
		mui("body").on("tap", ".bookmark", deleteMark);
		mui("body").on("tap", ".booknote", showNoteMng);
		if (goMarkIdx) {
			goMark(goMarkIdx);
			goMarkIdx = null;
		}
	});
}

function goMark(section) {
	location.hash = "";
	location.hash = "#m" + section;
}
/********* bookMark *****************/

function showMark(section) {
	var obj = $($(".section").get(section));
	obj.prepend("<a name='m" + section + "' class=\"AMark\"></a>");
	obj.append("<span sidx='" + section + "' class='bookmark glyphicon glyphicon-tag'></span>");
}

function refreshMarkPage() {
	mui.fire(plus.webview.getWebviewById("marks.html"), 'markPageRefresh');
}

function deleteMark() {
	var sIdx = $(this).attr('sidx');
	$(this).fadeOut('fast', function() {
		$(this).remove();
	});
	mui.toast("已删除书签");
	bookMark.delete({
		path: pagePath,
		page: pageIdx,
		section: sIdx
	}, refreshMarkPage);
}

function makeMark() {
	var obj = $($(".section").get(sectionIdx)).find('.bookmark');
	if (obj.length == 0) {
		bookMark.insert({
			path: pagePath,
			page: pageIdx,
			section: sectionIdx,
			date: timestemp()
		}, function() {
			showMark(sectionIdx);
			marksAndNotesReady();
			refreshMarkPage();
		});
		mui.toast("已加入书签");
	} else {
		mui.toast("此段落已存在一个书签");
	}
	mui('#popover').popover('hide');
	

}

function removeMark() {
	var markObj = $(this);
	bookMark.delete({
		path: markObj.attr('path'),
		page: markObj.attr('page'),
		section: markObj.attr('section')
	}, function() {
		var obj = markObj.parents(".listLine");
		var id = obj.find(".pageLink").attr('src');
		mui.fire(plus.webview.getWebviewById(id), 'markRefresh');
		obj.slideUp('fast', function() {
			$(this).remove();
		});
	});

}

function getMarks() {
	bookMark.count(function(num) {
		if (num > 0) {
			bookMark.select(['path', 'page', 'section', 'date'], "1 order by `date` desc", function(res) {
				var len = res.rows.length;
				var txt = "";
				for (var i = 0; i < len; i++) {
					var obj = res.rows.item(i);
					txt += "<div class=\"listLine\">" + makePageLinkByRecord(obj) + "<span class=\"mui-pull-right\">" + "<span class=\"glyphicon glyphicon-remove-sign userTag removeTag\" " + " path=\"" + obj.path + "\"" + "page=\"" + obj.page + "\"" + "section=\"" + obj.section + "\"" + ">&nbsp;</span>" + "<span class='date'>" + getLocalTime(obj.date) + "</span></span><hr></div>";
				}
				$('.mui-content').html(txt);
				$().ready(function() {
					mui("body").on('tap', '.removeTag', removeMark);
				});
				linkListen();
			});
		} else {
			var info = "<br><div class=\"panel panel-info appIllustrate\"><div class=\"panel-heading \">" + "<h3 class=\"panel-title\">还没有加入书签</div><div class=\"panel-body\">" + "<h5><b>加入标书签方法</b>  <h5><p>阅读到某一段落时，双击该段文字，然后在弹出菜单中选择\"插入书签\"选项。</p>" + "</div></div>";
			$('.mui-content').html(info);
		}
	});
}

/********* bookNote *****************/
function showNoteMng() {
	mui('#noteMng').popover('show');
	sectionIdx = $(this).parents('.section').index('.section');
}
function showNote(section, note) {
	var obj = $($(".section").get(section));
	obj.prepend("<a name='m" + section + "' class=\"AMark\"></a>");
	var txt = "<div class='booknote'><p><span class='glyphicon glyphicon-pencil'></span><pre class=\"noteTxt\">" + note + "</pre></p></div>";
	obj.append(txt);
}

function deleteNote() {
	var obj = $($(".section").get(sectionIdx));
	mui('#noteMng').popover('hide');
	obj.fadeOut('fast', function() {
		obj.remove();		
	});
	bookNote.delete({
		path: pagePath,
		page: pageIdx,
		section: sectionIdx
	}, function(){
		mui.fire(plus.webview.getWebviewById("notes.html"), 'notePageRefresh');
	});
}

function makeNote() {

	var obj = $($(".section").get(sectionIdx)).find('.booknote');
	var con = "";
	var txt = $($(".section").get(sectionIdx)).find('.section-content').html();
	if (obj.length > 0) {
		con = obj.find('.noteTxt').html() + "\n";
	}
	var currentPage = plus.webview.currentWebview();
	mui.openWindow({
		url: 'editNote.html',
		id: 'editNote.html',
		extras: {
			note: con,
			bookname: getBookName(pagePath),
			content: txt,
			page: pageIdx,
			path: pagePath,
			sect: sectionIdx,
			srcId: currentPage.id
		}
	});
	mui('#popover').popover('hide');	
	mui('#noteMng').popover('hide');

}

function removeNote() {
	var markObj = $(this);
	mui.confirm("笔记删除后无法再恢复，确定要删除笔记吗？", "删除笔记", ["确定", "取消"], function(res) {
		if (res.index == 0) {
			bookNote.delete({
				path: markObj.attr('path'),
				page: markObj.attr('page'),
				section: markObj.attr('section')
			}, function() {
				var obj = markObj.parents(".listLine");
				var id = obj.find(".pageLink").attr('src');
				mui.fire(plus.webview.getWebviewById(id), 'markRefresh');
				obj.slideUp('fast', function() {
					$(this).remove();
				});
			});
		}
	});
}

function getNotes() {
	bookNote.count(function(num) {
		if (num > 0) {
			bookNote.select(['path', 'page', 'section', 'note', 'date'], "1 order by `date` desc", function(res) {
				var len = res.rows.length;
				var txt = "";
				for (var i = 0; i < len; i++) {
					var obj = res.rows.item(i);
					var nt = obj.note.substr(0, 100);
					if (nt.length < obj.note.length) {
						nt += "...";
					};
					txt += "<div class=\"listLine\">" + makePageLinkByRecord(obj) 
					+ "<span class='date mui-pull-right'>" + getLocalTime(obj.date) + "</span>"
					+ "<span class=\"glyphicon glyphicon-remove-sign userTag removeTag mui-pull-right\" " 
					+ " path=\"" + obj.path + "\"" + "page=\"" + obj.page + "\"" + "section=\"" + obj.section + "\"" + ">&nbsp;</span>"
					
					+ "<div class='noteAbstract'><p>" + nt + "</p></div><hr></div>";
				}
				$('.mui-content').html(txt);
				linkListen();
				$().ready(function() {
					mui("body").on('tap', '.removeTag', removeNote);
				});

			});
		} else {
			var info = "<br><div class=\"panel panel-info appIllustrate\"><div class=\"panel-heading \">" + "<h3 class=\"panel-title\">还没有加入笔记</div><div class=\"panel-body\">" + "<h5><b>加入笔记方法</b>  <h5><p>阅读到某一段落时，双击该段文字，然后在弹出菜单中选择\"添加笔记\"选项进入笔记编辑页。</p>" + "</div></div>";
			$('.mui-content').html(info);
		}
	});
}

function notePageRefresh(id) {
	mui.fire(plus.webview.getWebviewById("notes.html"), 'notePageRefresh');
	mui.fire(plus.webview.getWebviewById(id), 'markRefresh');
	oldBack();
}

function saveNote(note) {
	var condition = {
		page: self.page,
		path: self.path,
		section: self.sect
	};
	bookNote.count(condition, function(num) {
		if (num > 0) {
			bookNote.update({
					note: note,
					date: timestemp()
				}, condition,
				function() {
					notePageRefresh(self.srcId);					
				}
			);
		} else {
			bookNote.insert({
					page: self.page,
					path: self.path,
					section: self.sect,
					note: note,
					date: timestemp()
				},
				function() {
					notePageRefresh(self.srcId);
				}
			);
		}
	});
}