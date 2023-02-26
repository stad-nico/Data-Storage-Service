// block the "move/copy/etc allowed" visuals for external files
// window.addEventListener("dragover", () => console.log("over"));
const DRAG_SOURCE_ATTRIBUTE = "data-drag-source";
const DRAG_HOVER_CSS_CLASS = "drag-hover";

var number = 0;

window.addEventListener("dragenter", function (e) {
	if (!e.target.hasAttribute("data-drop-zone")) {
		this.addEventListener("dragover", preventDroppingContentsFromOtherWindows);
	} else {
		this.removeEventListener("dragover", preventDroppingContentsFromOtherWindows);
	}
});

window.addEventListener("drop", function (e) {
	e.preventDefault();
	e.dataTransfer.effectAllowed = "none";
	e.dataTransfer.dropEffect = "none";
});

export function makeDraggable(element) {
	element.setAttribute("draggable", true);

	element.addEventListener("dragstart", function (e) {
		if (!e.target.hasAttribute("draggable")) {
			e.preventDefault();
			return;
		}

		markAsDragSourceElement(e.target);
		showTooltip(e);

		document.addEventListener("dragover", updateTooltipPosition);
	});

	element.addEventListener("dragend", function () {
		removeDragSourceAttribute(this);
		removeDragHoverCSSClass(this);

		document.removeEventListener("dragover", updateTooltipPosition);
		hideTooltip();
	});
}

export function makeDropZone(element, allowOnlyExternalDrops = false) {
	element.setAttribute("data-drop-zone", true);

	element.addEventListener("dragenter", e => e.preventDefault());

	if (allowOnlyExternalDrops) {
		element.addEventListener("dragover", allowDropIfExternalContent);
	} else {
		element.addEventListener("dragover", allowDropIfNotDragSourceElement);
	}

	element.addEventListener("dragleave", e => {
		removeDragHoverCSSClassIfNotDragSourceElement(e.target);
		emptyTooltipDescription();
		setTooltipDescriptionSourceOnly();
	});

	element.addEventListener("drop", drop);
}

function showTooltip(event) {
	let icon = document.querySelector("#drag-icon");
	icon.style.display = "flex";

	if (event.target.classList.contains("file")) {
		icon.classList.add("file");
		icon.classList.remove("folder");
	} else if (
		event.target.classList.contains("folder") ||
		event.target.parentNode.classList.contains("interactive-path-component") ||
		event.target.parentNode.classList.contains("collapsable-folder-structure-element")
	) {
		icon.classList.add("folder");
		icon.classList.remove("file");
	}

	emptyTooltipDescription();

	setTooltipDescriptionSourceOnly();

	// set the data image to null to show nothing (drag image is translucent by default, so a workaround is needed)
	event.dataTransfer.setDragImage(new Image(), 0, 0);
	// display own icon at cursor position
	icon.style.left = event.pageX + "px";
	icon.style.top = event.pageY + "px";
}

function emptyTooltipDescription() {
	document.querySelectorAll("#drag-icon span").forEach(elem => (elem.innerText = ""));
}

function setTooltipDescriptionSourceOnly() {
	let icon = document.querySelector("#drag-icon");
	if (document.querySelector(`*[${DRAG_SOURCE_ATTRIBUTE}]`)) {
		icon.querySelector(".tooltip").classList.add("source-only");
		icon.querySelector(".tooltip span.source").innerText = getNameFromPath(getPathFromDragSourceElement());
	}
}

function updateTooltipPosition(event) {
	let icon = document.querySelector("#drag-icon");
	icon.style.left = event.pageX + "px";
	icon.style.top = event.pageY + "px";
}

function hideTooltip() {
	document.querySelector("#drag-icon").style.display = "none";
}

function updateTooltipDestination(stringDest) {
	console.log(stringDest);
	document.querySelector("#drag-icon .action").innerText = " verschieben nach ";
	document.querySelector("#drag-icon .dest").innerText = stringDest;
	document.querySelector("#drag-icon .tooltip").classList.remove("source-only");
}

function read(entry, callback) {
	if (entry.isFile) {
		number++;
		entry.file(file => callback(entry.fullPath, file));
	} else if (entry.isDirectory) {
		let reader = entry.createReader();
		reader.readEntries(entries => {
			for (let entry of entries) {
				if (entry.isDirectory) {
					read(entry, callback);
				} else {
					number++;
					entry.file(file => callback(entry.fullPath, file));
				}
			}
		});
	}
}

function uploadFiles(destination, files) {
	console.log("HI");
	let formData = new FormData();

	formData.append("destination", destination);
	for (let item of files) {
		formData.append("path", item.path);
		formData.append("file", item.file);
	}

	let xhr = new XMLHttpRequest();
	xhr.open("POST", "http://localhost:3000/upload", true);
	xhr.addEventListener("readystatechange", function (e) {
		if (xhr.readyState === 4 && xhr.status === 200) {
			console.info("uploaded " + number + " items to server");
		} else if (xhr.readyState === 4 && xhr.status !== 200) {
			console.log("error while uploading");
		}
	});
	xhr.send(formData);
}

function drop(event) {
	console.log(event);
	event.preventDefault();
	event.stopPropagation();

	hideTooltip();
	removeDragHoverCSSClass(event.target);

	if (event.dataTransfer.types.includes("Files")) {
		let destination;
		if (event.target.getAttribute("id") === "contents") {
			destination = window.location.pathname;
		} else {
			destination = (event.target.querySelector(".path") || event.target.parentElement.querySelector(".path")).innerText;
		}
		// dragging from other window!
		number = 0;
		let files = [];
		let items = event.dataTransfer.items;

		for (let item of items) {
			console.log(item);
			let entry = item.webkitGetAsEntry();
			read(entry, (fullPath, file) => {
				files.push({
					path: fullPath,
					file: file,
				});

				console.log(files.length, number);
				if (files.length === number) {
					uploadFiles(destination, files);
				}
			});
		}
	} else {
		// dragging from other windows doesnt set a data-drag-source as no dragstart event is fired
		let dragSourceElement = document.querySelector(`*[${DRAG_SOURCE_ATTRIBUTE}]`);

		if (!dragSourceElement) {
			console.error("something went wrong; no drag source element found");
			return;
		}

		removeDragHoverCSSClass(dragSourceElement);
		removeDragSourceAttribute(dragSourceElement);

		let oldPath = (dragSourceElement.querySelector(".path") || dragSourceElement.parentElement.querySelector(".path")).innerText;
		let part = oldPath.match(/[^\/]+\/?$/gim)[0];
		let newPath = getPathFromDropZone(event.target) + part;
		if (oldPath === newPath) {
			return;
		}

		window.socket.emit("rename", oldPath, newPath, error => {
			if (error) {
				console.log(error);
			} else {
				console.log("successfully moved content");
			}
		});
	}
}

function getPathFromDragElement(element) {
	if (!element) {
		return "";
	}

	if (element.querySelector(".path")) {
		return element.querySelector(".path").innerText;
	}

	if (element.parentElement.querySelector(".path")) {
		return element.parentElement.querySelector(".path").innerText;
	}
}

function getPathFromDragSourceElement() {
	return getPathFromDragElement(document.querySelector(`*[${DRAG_SOURCE_ATTRIBUTE}]`));
}

function getNameFromPath(path) {
	let match = path.match(/([^\/]+\/?$)|^\/$/gim);

	if (!match) {
		return "";
	}

	if (match[0] === "/") {
		return match[0];
	}

	return match[0].endsWith("/") ? match[0].slice(0, -1) : match[0];
}

function getPathFromDropZone(element) {
	if (element.getAttribute("id") === "contents") {
		return window.location.pathname;
	}

	return (element.querySelector(".path") || element.parentNode.querySelector(".path")).innerText;
}

function removeDragSourceAttribute(element) {
	element.removeAttribute(DRAG_SOURCE_ATTRIBUTE);
}

function preventDroppingContentsFromOtherWindows(event) {
	event.preventDefault();
	event.dataTransfer.dropEffect = "none";
	event.dataTransfer.effectAllowed = "none";
}

function removeDragHoverCSSClassIfNotDragSourceElement(element) {
	if (!element.hasAttribute(DRAG_SOURCE_ATTRIBUTE)) {
		removeDragHoverCSSClass(element);
	}
}

function removeDragHoverCSSClass(element) {
	element.classList.remove(DRAG_HOVER_CSS_CLASS);
}

function allowDropIfExternalContent(event) {
	if (
		!document.querySelector(`*[${DRAG_SOURCE_ATTRIBUTE}]`) ||
		!document.querySelector("#directory-contents #contents").contains(document.querySelector(`*[${DRAG_SOURCE_ATTRIBUTE}`))
	) {
		allowDropIfNotDragSourceElement(event);
	}
}

function allowDropIfNotDragSourceElement(event) {
	if (!event.target.hasAttribute(DRAG_SOURCE_ATTRIBUTE) && !event.target.classList.contains("file")) {
		allowDrop(event);
	}
}

function allowDrop(event) {
	if (!event.target.classList.contains(DRAG_HOVER_CSS_CLASS)) {
		event.target.classList.add(DRAG_HOVER_CSS_CLASS);
	}

	console.log(event.target);
	updateTooltipDestination(getNameFromPath(getPathFromDragElement(event.target)));
	event.preventDefault();
}

function markAsDragSourceElement(elem) {
	elem.classList.add(DRAG_HOVER_CSS_CLASS);
	elem.setAttribute(DRAG_SOURCE_ATTRIBUTE, true);
}
