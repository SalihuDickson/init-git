import CLI from "clui";
import Configstore from "configstore";
import ockto from "@octokit/rest";
import { createBasicAuth } from "@octokit/auth-basic";

import {
  askGithubCredentials,
  getTwoFactorAuthenticationCode,
} from "./inquirer.js";
import pkg from "../package.json" assert { type: "json" };

const { Octokit } = ockto;
const { Spinner } = CLI;
const conf = new Configstore(pkg.name);

let octokit;

const getInstance = () => {
  return octokit;
};

const getStoredGithubToken = () => {
  return conf.get("github.token");
};

const getPersonalAccessToken = async () => {
  const credentials = await askGithubCredentials();
  const status = new Spinner("Authenticating your credentials, please wait...");

  status.start();

  const auth = createBasicAuth({
    username: credentials.username,
    password: credentials.password,
    async on2Fa() {
      status.stop();
      const res = await getTwoFactorAuthenticationCode();
      status.start();
      return res.twoFactorAuthenticationCode;
    },
    token: {
      scopes: ["user", "public_repo", "repo", "repo:status"],
      note: "git init, the command-line tool for initalizing Git repos",
    },
  });

  try {
    const res = await auth();

    if (res.token) {
      conf.set("github.token", res.token);
      return res.token;
    } else {
      throw new Error("GitHub token was not found in the response");
    }
  } finally {
    status.stop();
  }
};

const githubAuth = (token) => {
  octokit = new Octokit({
    auth: token,
  });
};

export {
  getInstance,
  getStoredGithubToken,
  getPersonalAccessToken,
  githubAuth,
};
