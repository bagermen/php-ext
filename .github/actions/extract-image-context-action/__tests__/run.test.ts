import {run} from "@src/main";
import {DockerHubTags, OFFICIALIMAGES_NAMESPACE} from "docker-hub-tags";
import * as core from '@actions/core'
import * as tools from "@src/tools";

let dhtInitMock: jest.SpiedFunction<typeof DockerHubTags.init>;
let debugMock: jest.SpiedFunction<typeof core.debug>;
let inputMock: jest.SpiedFunction<typeof core.getInput>;
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
let findDockerFileNamesMock: jest.SpiedFunction<typeof tools.findDockerFileNames>;

describe("DockerHub Queries", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		debugMock = jest.spyOn(core, "debug").mockImplementation();
		setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();
		setOutputMock = jest.spyOn(core, "setOutput").mockImplementation();
		findDockerFileNamesMock = jest.spyOn(tools, "findDockerFileNames").mockResolvedValue(["Dockerfile.alpine"]);
		inputMock = jest.spyOn(core, "getInput").mockImplementation(name => {
			switch (name) {
				case "php_version":
					return "8.3.8";
				case "php_ext_namespace":
					return "besogon1";
				case "php_type":
					return "fpm";
				case "php_ext_suffix":
					return "ext";
			}
			return "";
		});
	});

	test("PHPTag exists, do not check PHPExt repo", async () => {
		inputMock = jest.spyOn(core, "getInput").mockImplementation(name => {
			switch (name) {
				case "php_version":
					return "8.3.8";
				case "php_ext_namespace":
					return "";
				case "php_type":
					return "fpm";
				case "php_ext_suffix":
					return "ext";
			}
			return "";
		});

		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[{\"dockerFile\":\"Dockerfile.alpine\",\"phpTag\":\"8.3.8-fpm-alpine\",\"phpExtTag\":\"8.3.8-fpm-alpine-ext\",\"latest\":false}]");
	});

	test("PHPTag doesn't exists, do not check PHPExt repo", async () => {
		inputMock = jest.spyOn(core, "getInput").mockImplementation(name => {
			switch (name) {
				case "php_version":
					return "8.3.1";
				case "php_ext_namespace":
					return "";
				case "php_type":
					return "fpm";
				case "php_ext_suffix":
					return "ext";
			}
			return "";
		});

		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[]");
	});

	test("PHPTag exists, PHPExtTag doesn't exists", async () => {
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[{\"dockerFile\":\"Dockerfile.alpine\",\"phpTag\":\"8.3.8-fpm-alpine\",\"phpExtTag\":\"8.3.8-fpm-alpine-ext\",\"latest\":true}]");
	});

	test("PHPTag doesn't exists, PHPExtTag doesn't exists", async () => {
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[]");
	});

	test("PHPTag exists, PHPExtTag exists", async () => {
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)(phpExtTagInfo) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[]");
	});

	test("PHPTag doesn't, PHPExtTag exists", async () => {
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)(phpExtTagInfo) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();
		expect(setOutputMock).toHaveBeenCalledWith("context", "[]");
	});

	test("Push PHPExtTag with an old tag", async () => {
		inputMock = jest.spyOn(core, "getInput").mockImplementation(name => {
			switch (name) {
				case "php_version":
					return "8.3.3";
				case "php_ext_namespace":
					return "besogon1";
				case "php_type":
					return "fpm";
				case "php_ext_suffix":
					return "ext";
			}
			return "";
		});

		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)(phpExtTagInfo) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();

		expect(setOutputMock).toHaveBeenCalledWith("context","[{\"dockerFile\":\"Dockerfile.alpine\",\"phpTag\":\"8.3.3-fpm-alpine\",\"phpExtTag\":\"8.3.3-fpm-alpine-ext\",\"latest\":false}]");
	});

	test("Push PHPExtTag with an New tag", async () => {
		inputMock = jest.spyOn(core, "getInput").mockImplementation(name => {
			switch (name) {
				case "php_version":
					return "8.3.9";
				case "php_ext_namespace":
					return "besogon1";
				case "php_type":
					return "fpm";
				case "php_ext_suffix":
					return "ext";
			}
			return "";
		});

		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockImplementation((namespace, _repository) => {
			let dhtInstance: DockerHubTags;

			if (namespace === OFFICIALIMAGES_NAMESPACE) {
				dhtInstance = new (DockerHubTags as any)(phpTagInfo) as DockerHubTags;
			} else {
				dhtInstance = new (DockerHubTags as any)(phpExtTagInfo) as DockerHubTags;
			}

			return Promise.resolve(dhtInstance);
		});

		await run();

		expect(setOutputMock).toHaveBeenCalledWith("context","[{\"dockerFile\":\"Dockerfile.alpine\",\"phpTag\":\"8.3.9-fpm-alpine\",\"phpExtTag\":\"8.3.9-fpm-alpine-ext\",\"latest\":true}]");
	});
});


/* #region Test data */
const phpTagInfo = [
	{
		"creator": 1156886,
		"id": 690474914,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:dfd831b50b0c03ab75ae196835fd3b2c3c28e7937a4a852bf5cce1d0d57c6ea2",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 32521545,
				"status": "active",
				"last_pulled": "2024-07-04T10:44:57.837765Z",
				"last_pushed": "2024-06-21T02:23:42.351591Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v6",
				"digest": "sha256:18692edfb66c49c54db64ba2a3fe6663ed361d12d71f0aa5b12fe73d7ad671dd",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31075203,
				"status": "active",
				"last_pulled": "2024-07-04T10:40:07.831422Z",
				"last_pushed": "2024-06-20T23:21:33.534147Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v7",
				"digest": "sha256:44fcd4746183213beeb45675d61c65d1aa6db6de31f29dd0fad6c079f82942f4",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 29876959,
				"status": "active",
				"last_pulled": "2024-07-04T10:40:08.004969Z",
				"last_pushed": "2024-06-20T20:30:26.000992Z"
			},
			{
				"architecture": "arm64",
				"features": "",
				"variant": "v8",
				"digest": "sha256:0d650ef7aa188d26df598566136d730c866845bae21fd765a31e2aa6f505fda4",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 33093549,
				"status": "active",
				"last_pulled": "2024-07-04T10:33:25.927769Z",
				"last_pushed": "2024-06-21T00:19:18.213569Z"
			},
			{
				"architecture": "386",
				"features": "",
				"variant": null,
				"digest": "sha256:9354cc0e80a7b6b917e051bb242539c9ee2394396c022a2ce278f3998ccbefa0",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 32748231,
				"status": "active",
				"last_pulled": "2024-07-04T10:59:09.54803Z",
				"last_pushed": "2024-06-20T23:01:21.102292Z"
			},
			{
				"architecture": "ppc64le",
				"features": "",
				"variant": null,
				"digest": "sha256:f6b4c1139846a653881a080bcbf50979540ca2a5881355f62195c035728b32ea",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 33092805,
				"status": "active",
				"last_pulled": "2024-07-04T11:01:07.604097Z",
				"last_pushed": "2024-06-20T19:55:26.192664Z"
			},
			{
				"architecture": "riscv64",
				"features": "",
				"variant": null,
				"digest": "sha256:299f6b4ad59d95e361a82d6d4a405e31a2cbb84a15792be38917ea60194b4a60",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31949565,
				"status": "active",
				"last_pulled": "2024-07-04T11:01:07.766773Z",
				"last_pushed": "2024-06-21T04:55:01.030846Z"
			},
			{
				"architecture": "s390x",
				"features": "",
				"variant": null,
				"digest": "sha256:4b04c6262e9d72f55aed8bd8e85432ba8982591e0891f7c23bed2c5b12de9b0d",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 32518304,
				"status": "active",
				"last_pulled": "2024-07-04T11:01:07.938585Z",
				"last_pushed": "2024-06-21T02:23:42.599544Z"
			}
		],
		"last_updated": "2024-06-21T05:14:48.231504Z",
		"last_updater": 1156886,
		"last_updater_username": "doijanky",
		"name": "8.3.8-fpm-alpine",
		"repository": 51054,
		"full_size": 32521545,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-04T11:22:47.149292Z",
		"tag_last_pushed": "2024-06-21T05:14:48.231504Z",
		"media_type": "application/vnd.docker.distribution.manifest.list.v2+json",
		"content_type": "image",
		"digest": "sha256:7c3948e54737d9e4271637639250e63b7f8fd2d58ecf31ac7663985c9ce7263c"
	},
	{
		"creator": 1156886,
		"id": 604964868,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:0ac27ccf6d303a57779c610aad4fe8ae8d0b0b2b7e3626477a157308d1ff5454",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31766209,
				"status": "active",
				"last_pulled": "2024-07-04T11:26:43.419129Z",
				"last_pushed": "2024-02-16T23:11:16.378953Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v6",
				"digest": "sha256:beeacf34dc126c0ec01d61a1f4f69eade652a539a04bf5e9d08084003415792d",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 30356565,
				"status": "active",
				"last_pulled": "2024-07-01T12:12:36.174984Z",
				"last_pushed": "2024-02-16T20:55:44.032505Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v7",
				"digest": "sha256:05d8e18065e4aca66f264839872ce5a8efd11d8cceca4268267dcc22568831cc",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 29218855,
				"status": "active",
				"last_pulled": "2024-07-01T12:12:36.314268Z",
				"last_pushed": "2024-02-16T22:23:14.836507Z"
			},
			{
				"architecture": "arm64",
				"features": "",
				"variant": "v8",
				"digest": "sha256:15b07d043c9c0aff22b2268982381ca944b41a1a5c7182f5d8524a8128baf97f",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31811732,
				"status": "active",
				"last_pulled": "2024-07-04T07:49:32.798397Z",
				"last_pushed": "2024-02-17T00:53:59.360571Z"
			},
			{
				"architecture": "386",
				"features": "",
				"variant": null,
				"digest": "sha256:cf390b1da97637f9be59dbfeab14d6fa406b5c54156586e2130a1d633ca12c5d",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31993669,
				"status": "active",
				"last_pulled": "2024-07-04T08:29:34.490357Z",
				"last_pushed": "2024-02-16T23:11:17.561652Z"
			},
			{
				"architecture": "ppc64le",
				"features": "",
				"variant": null,
				"digest": "sha256:dd39b7b18faf4c8b94bf70c21b3bd386f1956ff32fb4f71d291d085563b0a8bb",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 32291788,
				"status": "active",
				"last_pulled": "2024-06-28T08:52:16.28927Z",
				"last_pushed": "2024-02-16T22:23:16.094571Z"
			},
			{
				"architecture": "s390x",
				"features": "",
				"variant": null,
				"digest": "sha256:5169e33863299d318f26808fa805e5864a5cd2ec214c33af084538263d108bfe",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 31523881,
				"status": "active",
				"last_pulled": "2024-06-28T08:52:16.718982Z",
				"last_pushed": "2024-02-16T23:30:49.089253Z"
			}
		],
		"last_updated": "2024-02-17T01:11:09.152715Z",
		"last_updater": 1156886,
		"last_updater_username": "doijanky",
		"name": "8.3.3-fpm-alpine",
		"repository": 51054,
		"full_size": 31766209,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-04T11:26:43.419129Z",
		"tag_last_pushed": "2024-02-17T01:11:09.152715Z",
		"media_type": "application/vnd.docker.distribution.manifest.list.v2+json",
		"content_type": "image",
		"digest": "sha256:5642a2fd6c6121ea0aacc08db7ee211825b83a0fb8a47dd0c2682dacfa171639"
	},
	{
		"creator": 1156886,
		"id": 714892109,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:c3e096f192f14f4ac0becb4bf72f7f2b9b164d137c758cb00fd795e7eb208589",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 35775449,
				"status": "active",
				"last_pulled": "2024-07-07T16:09:48.828968Z",
				"last_pushed": "2024-07-06T02:30:11.678878Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v6",
				"digest": "sha256:b2e890393d3d443f69b0d38d57c524154f3f67c62ce67bd036d9105d17cf474a",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 34026611,
				"status": "active",
				"last_pulled": "2024-07-07T16:18:07.744573Z",
				"last_pushed": "2024-07-06T01:55:18.198082Z"
			},
			{
				"architecture": "arm",
				"features": "",
				"variant": "v7",
				"digest": "sha256:66fd7d7003314c39989f4f2898506ca7ff6f4a4e3f279fee07bbab8e4a2bf61b",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 32613492,
				"status": "active",
				"last_pulled": "2024-07-07T16:17:21.333908Z",
				"last_pushed": "2024-07-06T02:50:07.663768Z"
			},
			{
				"architecture": "arm64",
				"features": "",
				"variant": "v8",
				"digest": "sha256:94e948722e1c9c78c35f9ca4c9f482c12e6fa3bb1f2becdbffc3583baed086b1",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 36798479,
				"status": "active",
				"last_pulled": "2024-07-07T15:43:59.064586Z",
				"last_pushed": "2024-07-06T02:33:01.943115Z"
			},
			{
				"architecture": "386",
				"features": "",
				"variant": null,
				"digest": "sha256:b47854316c119cc0d6be7b717adbb5afcfe593ca59b76973c2a8cac85678f909",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 35851897,
				"status": "active",
				"last_pulled": "2024-07-07T15:58:51.107056Z",
				"last_pushed": "2024-07-06T04:04:26.334227Z"
			},
			{
				"architecture": "ppc64le",
				"features": "",
				"variant": null,
				"digest": "sha256:3d41a1d95017ac43815c1acab6e82e699ca6663884f5ab05d2f297459bcdab42",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 36240245,
				"status": "active",
				"last_pulled": "2024-07-07T15:01:46.848061Z",
				"last_pushed": "2024-07-06T01:55:18.368092Z"
			},
			{
				"architecture": "riscv64",
				"features": "",
				"variant": null,
				"digest": "sha256:fedc2ded3b25f0c2a172adb5f18538461bf23e63e6e3e4d495a13f37f2033247",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 34911613,
				"status": "active",
				"last_pulled": "2024-07-07T15:01:47.560719Z",
				"last_pushed": "2024-07-06T06:19:53.697627Z"
			},
			{
				"architecture": "s390x",
				"features": "",
				"variant": null,
				"digest": "sha256:b5a1a1165c3fd4293aba7b333cff578e75ccd830de515b4d521e8acd74efbd9e",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 35601529,
				"status": "active",
				"last_pulled": "2024-07-07T15:01:48.257141Z",
				"last_pushed": "2024-07-06T02:22:27.450524Z"
			}
		],
		"last_updated": "2024-07-06T06:28:52.815401Z",
		"last_updater": 1156886,
		"last_updater_username": "doijanky",
		"name": "8.3.9-fpm-alpine",
		"repository": 51054,
		"full_size": 35775449,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-07T16:24:50.508951Z",
		"tag_last_pushed": "2024-07-06T06:28:52.815401Z",
		"media_type": "application/vnd.docker.distribution.manifest.list.v2+json",
		"content_type": "image",
		"digest": "sha256:8e5e771af8fbad68a6b761d075cd4f3267dbc9372fda5146ed350d8c2c84afeb"
	},
];

const phpExtTagInfo = [
	{
		"creator": 1457519,
		"id": 517838018,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:e30db743060ee70809cd535d14d435ad367b00ac28486592bd970224eeae7209",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 48222711,
				"status": "active",
				"last_pulled": "2024-07-03T14:59:26.138961Z",
				"last_pushed": "2024-07-03T14:59:25.22813Z"
			},
			{
				"architecture": "unknown",
				"features": "",
				"variant": null,
				"digest": "sha256:ef6d70e906d178852df26028ba7e352601354047d5a36902fcf3e31c12434b4b",
				"os": "unknown",
				"os_features": "",
				"os_version": null,
				"size": 17278,
				"status": "active",
				"last_pulled": "2024-07-03T14:59:26.197047Z",
				"last_pushed": "2024-07-03T14:59:25.389772Z"
			}
		],
		"last_updated": "2024-07-03T14:59:26.515907Z",
		"last_updater": 1457519,
		"last_updater_username": "besogon1",
		"name": "latest",
		"repository": 14798993,
		"full_size": 48222711,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-03T15:01:31.095136Z",
		"tag_last_pushed": "2024-07-03T14:59:26.515907Z",
		"media_type": "application/vnd.oci.image.index.v1+json",
		"content_type": "image",
		"digest": "sha256:2a2835eb5f05a0b53a8aa45080d263c3fb4d6e7a4fb38b07ba725433ec63d473"
	},
	{
		"creator": 1457519,
		"id": 713220855,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:e30db743060ee70809cd535d14d435ad367b00ac28486592bd970224eeae7209",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 48222711,
				"status": "active",
				"last_pulled": "2024-07-03T14:59:26.138961Z",
				"last_pushed": "2024-07-03T14:59:25.22813Z"
			},
			{
				"architecture": "unknown",
				"features": "",
				"variant": null,
				"digest": "sha256:ef6d70e906d178852df26028ba7e352601354047d5a36902fcf3e31c12434b4b",
				"os": "unknown",
				"os_features": "",
				"os_version": null,
				"size": 17278,
				"status": "active",
				"last_pulled": "2024-07-03T14:59:26.197047Z",
				"last_pushed": "2024-07-03T14:59:25.389772Z"
			}
		],
		"last_updated": "2024-07-03T14:59:25.622159Z",
		"last_updater": 1457519,
		"last_updater_username": "besogon1",
		"name": "8.3.8-fpm-alpine-ext",
		"repository": 14798993,
		"full_size": 48222711,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-03T15:01:31.095136Z",
		"tag_last_pushed": "2024-07-03T14:59:25.622159Z",
		"media_type": "application/vnd.oci.image.index.v1+json",
		"content_type": "image",
		"digest": "sha256:2a2835eb5f05a0b53a8aa45080d263c3fb4d6e7a4fb38b07ba725433ec63d473"
	},
	{
		"creator": 1457519,
		"id": 715422258,
		"images": [
			{
				"architecture": "amd64",
				"features": "",
				"variant": null,
				"digest": "sha256:a45703772b8bde23896b675b16d01201043e5c8043a9141a1cf283d0b2ebeac0",
				"os": "linux",
				"os_features": "",
				"os_version": null,
				"size": 185910470,
				"status": "active",
				"last_pulled": "2024-07-07T15:42:12.933524Z",
				"last_pushed": "2024-07-07T15:20:37.301179Z"
			},
			{
				"architecture": "unknown",
				"features": "",
				"variant": null,
				"digest": "sha256:9e440c5d27e3919d18f870df4c0926a2da09eccff322c8ca2307160910feb603",
				"os": "unknown",
				"os_features": "",
				"os_version": null,
				"size": 14746,
				"status": "active",
				"last_pulled": null,
				"last_pushed": "2024-07-07T15:20:37.520135Z"
			}
		],
		"last_updated": "2024-07-07T15:20:37.787051Z",
		"last_updater": 1457519,
		"last_updater_username": "besogon1",
		"name": "8.3.9-fpm-bookworm-ext",
		"repository": 14798993,
		"full_size": 185910470,
		"v2": true,
		"tag_status": "active",
		"tag_last_pulled": "2024-07-07T15:42:12.933524Z",
		"tag_last_pushed": "2024-07-07T15:20:37.787051Z",
		"media_type": "application/vnd.oci.image.index.v1+json",
		"content_type": "image",
		"digest": "sha256:47f5e92f794f4cdfad78b48645e2ad5af84a5c9c8f769e662930b9284324a927"
	},
];
/* #endregion */
