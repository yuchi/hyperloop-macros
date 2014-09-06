"use hyperloop"

var data = ['hello', 'world', 'how', 'are', 'you', 'doing?'];

class native TableViewController extends UITableViewController {

  - (void) viewDidLoad {
    var that = this as UITableViewController;

    var cellId = NSString.stringWithUTF8String("Cell"); //this must be a NSString
    var tblClass = UITableViewCell.class();
    var tableView = that.tableView as UITableView;

    tableView.registerClass(tblClass, forCellReuseIdentifier: cellId);
  }

  - (NSInteger) numberOfSectionsInTableView: (UITableView *) tableView {
    return 1;
  }

  - (NSInteger) tableView: (UITableView *) tableView
      numberOfRowsInSection: (NSInteger) rows {
    return data.length;
  }

  - (UITableViewCell *) tableView: (UITableView *) tableView
            cellForRowAtIndexPath: (NSIndexPath *) _path {
    var that = this as UITableViewController;

    var cellId = NSString.stringWithUTF8String("Cell"); // this must be a NSString
    var cell = tableView.dequeueReusableCellWithIdentifier(cellId, path) as UITableViewCell;

    if (!cell) {
      cell = new UITableViewCell();
    }

    var path = _path as NSIndexPath;

    var text = data[ path.row ];
    cell.textLabel.text = NSString.stringWithUTF8String(text);

    return cell;
  }

  - (void) tableView: (UITableView *) tableView
      didSelectRowAtIndexPath: (NSIndexPath *) _path {
    console.log('click');
  }
}

var frame = CGRectMake(100,100,20,20);
var bounds = UIScreen.mainScreen().bounds;
var window = UIWindow@initWithFrame(bounds);

var UITableViewStylePlain = 0;
var tableViewController = TableViewController@initWithStyle(UITableViewStylePlain);

window.addSubview(tableViewController.tableView);
window.makeKeyAndVisible();

tableViewController.onClick = function(e) {
  var row = e.row;
  var section = e.section;
  var tableView = e.tableView as UITableView;
  var indexPath = NSIndexPath.indexPathForRow(row, inSection: section);

  tableView.deselectRowAtIndexPath(indexPath, animated: true);

  alert('TableView Clicked!\nSection: ' + section + '\nRow: ' + row);
};

function alert(_str) {
  var alert = new UIAlertView();
  alert.title = NSString.stringWithUTF8String("Alert");
  alert.message = NSString.stringWithUTF8String(_str);
  alert.addButtonWithTitle(NSString.stringWithUTF8String('Ok'));
  alert.show();
}
