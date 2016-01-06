function quadScoreBinary(p) {
  return 1 - (1-p)*(1-p);
}

Scoring = class Scoring {
  static lsr(p, pp, outcome) {
    if (outcome)
      return Math.log(pp) - Math.log(p);
    else
      return Math.log(1-pp) - Math.log(1-p);
  }

  static qsr(p, pp, outcome) {
    if (outcome)
      return quadScoreBinary(pp) - quadScoreBinary(p);
    else
      return quadScoreBinary(1-pp) - quadScoreBinary(1-p);
  }
};
