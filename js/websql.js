var webSql = {
	debug: true,
	open: function(name, size) {
		var db_size = size ? size : 2;
		return openDatabase(name, '1.0', 'db_test', db_size * 1024 * 1024);
	},
	query: function(db, sql, callback) {
		db.transaction(function(tx) {
			tx.executeSql(sql, [], function(tx, res) {
				if(callback){
					callback(res);
				}
			});
		}, function(err) {
			if(this.debug){
				var txt = sql + "\n";
				for (var i in err) {
					txt += i + " : " + err[i] + "\n";
				}
				alert(txt);
			}
		});

	},
	condition: function(condition) {
		if (typeof(condition) == "string") {
			return " where " + condition;
		}
		if (condition.length == 0) {
			return "";
		}
		var ret = " where ";
		var bl = "";
		for (var i in condition) {
			ret += bl + "`" + i + "`=" + "'" + condition[i] + "'";
			bl = " AND "
		}
		return ret;
	},
	dbName: {}
}
var dataBase = function(table, dbname, size) {
	if (typeof(webSql.dbName[dbname]) == 'undefined') {
		this.db = webSql.open(dbname, size);
		webSql.dbName[dbname] = this.db;
	} else {
		this.db = webSql.dbName[dbname];
	}	
	this.table = "`" + table + "`";
	this.drop = function(callback) {
		var sql = "DROP TABLE " + this.table;
		webSql.query(this.db, sql, callback);
	}
	this.query = function(sql, callback) {
		webSql.query(this.db, sql, callback);
	}	
	this.create = function(fields, callback) {
		var sql = "CREATE TABLE IF NOT EXISTS " + this.table;
		if (typeof(fields['id']) != 'undefined') {
			sql += "( id " + fields['id'];
		} else {
			sql += " (id INTEGER NOT NULL PRIMARY KEY   AUTOINCREMENT ";
		}
		for (var i in fields) {
			if (i != 'id') {
				sql += ", `" + i + "` " + fields[i];
			}
		}
		sql += ")";
		webSql.query(this.db, sql, callback);
	};
	this.select = function(fields, condition, callback) {
		var sql = "select ";
		var bl = "";
		for (var i in fields) {
			sql += bl + "`" + fields[i] + "`";
			bl = ",";
		}
		sql += " from " + this.table;
		sql += webSql.condition(condition);
		webSql.query(this.db, sql, callback);
	};
	this.insert = function(values, callback) {
		var bl = "";
		var f = " (";
		var v = " (";
		for (var i in values) {
			f += bl + "`" + i + "`";
			v += bl + "'" + values[i] + "'";
			bl = ",";
		}
		f += ")";
		v += ")";
		var sql = 'insert into ' + this.table + f + ' values ' + v;
		webSql.query(this.db, sql, callback);
	};
	this.update = function(values, condition, callback) {
		var sql = "update " + this.table + " set ";
		var bl = "";
		for (var i in values) {
			sql += bl + "`" + i + "`='" + values[i] + "'";
			bl = ",";
		}
		sql += webSql.condition(condition);
		webSql.query(this.db, sql, callback);
	}
	this.delete = function(condition, callback) {
		var sql = "delete from " + this.table + webSql.condition(condition);
		webSql.query(this.db, sql, callback);
	}
	this.count = function(condition, callback) {
		if (typeof(condition) == 'function') {
			callback = condition;
			condition = [];
		}
		var sql = "select count(*) num from " + this.table + webSql.condition(condition);
		webSql.query(this.db, sql, function(res) {
			callback(res.rows.item(0).num);
		});
	}

}