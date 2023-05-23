import { Response, Request } from "express";
import { Socket } from "socket.io";
import { BackendToFrontendEvent, FrontendToBackendEvent } from "../APIEvents";
import { DirectoryContentType } from "../DirectoryContentType";
import { isPathSubdirectory } from "./src/isPathSubdirectory";
import { isAbsolutePathEqual } from "./src/isPathEqual";
import { getDirectoryContents } from "./src/getDirectoryContents";
import { doesPathExist } from "./src/doesPathExist";
import { DirectoryContentElement } from "../DirectoryContentElement";
import { Response as ServerResponse } from "../Response";
import { createSaveLocation } from "./src/createSaveLocation";

const dotenv = require("dotenv");
dotenv.config();

createSaveLocation();

const path = require("path");

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const PORT = process.env.SERVER_PORT || 4000;

const SAVE_LOCATION = process.env.SAVE_LOCATION;

app.use(express.static(path.join(__dirname, "../../dev")));

app.get("*", (req: Request, res: Response) => {
	res.sendFile(path.resolve(__dirname, "index.html"));
});

io.on("connection", (client: Socket) => {
	console.log("connection");
	client.emit(BackendToFrontendEvent.ConnectedToServer);

	client.on(FrontendToBackendEvent.ValidatePath, event => {
		console.log("event validate path received on server");
	});

	client.on(FrontendToBackendEvent.GetDirectoryContents, async (data: any, callback: (...args: any) => void) => {
		const testPath = path.resolve(path.join(SAVE_LOCATION, data));
		if (isPathSubdirectory(SAVE_LOCATION, testPath) || isAbsolutePathEqual(SAVE_LOCATION, testPath)) {
			if (await doesPathExist(testPath)) {
				let contents: DirectoryContentElement[] = await getDirectoryContents(SAVE_LOCATION, testPath, DirectoryContentType.FolderOrFile);
				callback(ServerResponse.Ok, contents);
			}

			callback(ServerResponse.Error, "Path does not exist");
		}

		callback(ServerResponse.Error, "Path is not valid");
	});
});

server.listen(PORT, () => {
	console.log(`Running on localhost: ${PORT}`);
});