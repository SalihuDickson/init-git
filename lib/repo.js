import CLI from "clui";
import fs from "fs";
import touch from "touch";
import _ from "lodash";
import { askRepoDetails, askIgnoreFiles } from "./inquirer.js";
import { getInstance } from "./github.js";
import simpleGit from "simple-git";

const git = simpleGit();

const createRemoteRepo = async () => {
  const github = getInstance();
  const answers = await askRepoDetails();

  const data = {
    name: answers.name,
    description: answers.description,
    private: answers.visibility === "private",
  };

  const status = new Spinner("Creating remote repository...");
  status.start();

  try {
    const response = await github.repos.createForAuthenticatedUser(data);
    return response.data.ssh_url;
  } finally {
    status.stop();
  }
};

const createGitignore = async () => {
  const filelist = _.without(fs.readdirSync("."), ".git", ".gitignore");

  if (filelist.length) {
    const answers = await askIgnoreFiles(filelist);

    if (answers.ignore.length) {
      fs.writeFileSync(".gitignore", answers.ignore.join("\n"));
    } else {
      touch(".gitignore");
    }
  } else {
    touch(".gitignore");
  }
};

const setupRepo = async (url) => {
  const status = new Spinner(
    "Initializing local repository and pushing to remote..."
  );
  status.start();

  try {
    git
      .init()
      .then(git.add(".gitignore"))
      .then(git.add("./*"))
      .then(git.commit("Initial commit"))
      .then(git.addRemote("origin", url))
      .then(git.push("origin", "master"));
  } finally {
    status.stop();
  }
};

export { createGitignore, createRemoteRepo, setupRepo };
