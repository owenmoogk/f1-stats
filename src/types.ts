export class Scorer {
	name = ""
	points = -1
	canWinByThemselves = false
	highestPossible = -1
	lowestPossible = -1

	constructor(name: string, points: number) {
		this.name = name
		this.points = points
	}
}

export class Driver extends Scorer{}

export class Constructor extends Scorer{}