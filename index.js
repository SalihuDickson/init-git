import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { getCurrentDirectoryBase, directoryExists } from "./lib/files.js";
import {
  getStoredGithubToken,
  getPersonalAccessToken,
  githubAuth,
} from "./lib/github.js";
import { createRemoteRepo, createGitignore, setupRepo } from "./lib/repo.js";

// if (directoryExists(".git")) {
//   console.log(chalk.red("Already a Git repository!"));
//   process.exit();
// }

const getGithubToken = async () => {
  // Fetch token from config store
  let token = getStoredGithubToken();
  if (token) {
    return token;
  }

  // No token found, use credentials to access GitHub account
  token = await getPersonalAccessToken();

  return token;
};

const run = async () => {
  try {
    // Retrieve & Set Authentication Token
    const token = await getGithubToken();
    githubAuth(token);

    // Create remote repository
    const url = await createRemoteRepo();

    // Create .gitignore file
    await createGitignore();

    // Set up local repository and push to remote
    await setupRepo(url);

    console.log(chalk.green("All done!"));
  } catch (err) {
    if (err) {
      switch (err.status) {
        case 401:
          console.log(
            chalk.red(
              "Couldn't log you in. Please provide correct credentials/token."
            )
          );
          break;
        case 422:
          console.log(
            chalk.red(
              "There is already a remote repository or token with the same name"
            )
          );
          break;
        default:
          console.log(chalk.red(err));
      }
    }
  }
};
run();
