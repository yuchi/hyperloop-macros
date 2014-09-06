use hyperloop;

var data = ['hello', 'world', 'how', 'are', 'you', 'doing?'];

Object.defineProperty(String.prototype, 'ns', {
  enumerable: false,
  value: function String$ns() {
    return NSString.stringWithUTF8String(this);
  }
});

class native TableViewController extends UITableViewController {

  - (void) viewDidLoad {
    var tableView = (this as UITableViewController).tableView as UITableView;

    tableView.registerClass(UITableViewCell.class(), forCellReuseIdentifier: "Cell".ns());
  }

  - (NSInteger) numberOfSectionsInTableView: (UITableView *) tableView {
    return 1;
  }

  - (NSInteger) tableView: (UITableView *) tableView
      numberOfRowsInSection: (NSInteger) rows {
    return data.length;
  }

  - (UITableViewCell *) tableView: (UITableView *) tableView
            cellForRowAtIndexPath: (NSIndexPath *) path {
    var cell = tableView.dequeueReusableCellWithIdentifier("Cell".ns(), path) as UITableViewCell;

    if (!cell) {
      cell = new UITableViewCell();
    }

    cell.textLabel.text = (data[ path.row ] + Math.random()).ns();

    return cell;
  }

  - (void) tableView: (UITableView *) tableView
      didSelectRowAtIndexPath: (NSIndexPath *) path {
    console.log(String(this) + ' clicked ' + JSON.stringify(data[ path.row ]));
  }
}

var frame = CGRectMake(100,100,20,20);
var bounds = UIScreen.mainScreen().bounds;
var window = UIWindow@initWithFrame(bounds);

var UITableViewStylePlain = 0;

var tableViewController = TableViewController@initWithStyle(UITableViewStylePlain);
window.addSubview(tableViewController.tableView);

window.makeKeyAndVisible();

function alert(message) {
  var alert = new UIAlertView();
  alert.title = "Alert".ns();
  alert.message = message.ns();
  alert.addButtonWithTitle('Ok'.ns());
  alert.show();
}
