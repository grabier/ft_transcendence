export function createElement(
	tag: string,
	className: string = "",
	attributes: Record<string, string> = {},
	children: (HTMLElement | SVGElement | string)[] = []
): HTMLElement {
	const element = document.createElement(tag);
	if (className) element.className = className;
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	children.forEach(child => {
		if (typeof child === 'string') {
			element.appendChild(document.createTextNode(child));
		} else {
			element.appendChild(child);
		}
	});
	return element;
}

export function createIcon(iconId: string, className: string = "w-5 h-5"): SVGElement {
	const svgNS = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(svgNS, "svg");

	if (className) svg.setAttribute("class", className);

	const use = document.createElementNS(svgNS, "use");
	use.setAttribute("href", `/assets/sprites.svg#${iconId}`);

	svg.appendChild(use);
	return svg;
}