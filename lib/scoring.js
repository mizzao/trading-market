Scoring = class Scoring {
  static lsr(p, pp, outcome) {
    if (outcome)
      return Math.log(pp) - Math.log(p);
    else
      return Math.log(1-pp) - Math.log(1-p);
  }
};
