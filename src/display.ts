export const interpolateColor = (value: number, max: number) => {
	const green = [144, 238, 144]; // RGB for lightgreen
const red = [255, 204, 203];   // RGB for #FFCCCB

	const ratio = (value - 1) / (max - 1); // Normalize value between 0 and 1

	const interpolatedColor = green.map((c, i) => Math.round(c + ratio * (red[i] - c)));
	return `rgb(${interpolatedColor.join(',')})`;
};