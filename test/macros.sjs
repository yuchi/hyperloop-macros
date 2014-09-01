let describe = macro {
  rule { $name $body } => {
    describe($name, function () $body);
  }
}

let it = macro {
  rule { $name $body } => {
    it($name, function () $body);
  }
}

let xit = macro {
  rule { $name $body } => {
    xit($name, function () $body);
  }
}

let TODO = macro {
  rule { $name } => {
    xit $name {};
  }
}

export describe;
export it;
export TODO;
export xit;
