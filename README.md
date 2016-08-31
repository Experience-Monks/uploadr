# uploadr

A command-line tool which copies a folder's contents to a server via SFTP. Inspired by [surge.sh](https://surge.sh/).

<img src="http://i.imgur.com/oAfBdz5.gif" width="400" />

Features:

- Progress bar shows bytes transferred while uploading 
- Pattern matching to isolate/ignore files while uploading
- Prompts for username/password if necessary
- Can persist credentials to a git-ignored `.env` file
- Provides clear logging and handles common user errors

###### *Note: This tool is experimental and mostly used internally.*

## Docs

- [Quick-Start](#quick-start)
- [Credentials with `.env` file](#credentials-with-env-file)
- [CLI Usage](#cli-usage)
- [Persistence with `--save`](#persistence-with---save)
- [Ignoring Files](#ignoring-files)
- [Uploading Specific Files](#uploading-specific-files)

## Quick-Start

It's recommended you install and use this tool as a local dependency:

```sh
npm i uploadr --save-dev
```

Now, you can add a script to your npm scripts in `package.json`:

```json
{
  "scripts": {
    "deploy": "uploadr --host foo.com --source app/ --dest /home/public_html/"
  }
}
```

You can run the script with the following:

```sh
npm run deploy
```

This will prompt for SFTP credentials, then recursively copy the contents of your local `app/` folder into the remote `/home/public_html/` folder.

## Credentials with `.env` file

You can avoid entering your username/password each time by adding a `.env` file to your working directory.

It should be JSON, optionally with comments.

```json
{
  "username": "beep",
  "password": "boop"
}
```

:bulb: *Don't forget to gitignore this file!*

## CLI Usage

Full details:

```
uploadr [opts]

Options
  --src, -s        local source folder (default cwd)
  --dest, -d       destination folder on remote server
  --host, -h       host for login
  --username, -u   username for login (default 'anonymous')
  --password, -p   password for login (default empty string)
  --key, -k        path to an SSH private key for login
  --port, -p       port to connect (default 22)
  --ignore, -i     pattern(s) to ignore in the upload queue
  --only, -o       pattern(s) to isolate and only upload for this run
  --save, -S       writes an .env file to cwd and gitignore if necessary
  --no-prompt      do not prompt – only read auth data from .env file
```

## Persistence with `--save`

You can use the `--save` option if you want to persist the username/password after prompt. It will write a new `.env` file in your working directory, and add it to a `.gitignore` file in the same directory.

```sh
uploadr --save --host foo.com --source app/ --dest /home/public_html/
```

This is handy for streamlining the development experience on small teams.

## Ignoring Files

By default, we ignore the same patterns as [surge-ignore](https://www.npmjs.com/package/surge-ignore).

You can ignore more files with the `--ignore` flag and with a `.ftpignore` file. This expects the same pattern matching as a typical `.gitignore` file. Example:

```sh
uploadr --ignore *.mp4 -h foo.com -s app/ -d /home/public_html
```

Here is an example `.ftpignore` file which un-ignores (allows) something in `node_modules/`.

```txt
*.psd
some/file/to/ignore.txt
app/sensitive.txt
!node_modules/foo/
```

## Uploading Specific Files

You can use the `--only` flag if you just want to upload specific file globs.

The following is an example of a `deploy-js` script, which only uploads JavaScript files:

```json
{
  "scripts": {
    "deploy": "uploadr -h foo.com -s app -d /home/public_html/",
    "deploy-js": "npm run deploy -- --only *.js"
  }
}
```

## Roadmap

There are no real plans for the future of this tool. However, the following may be explored at some point:

- programmatic API and more modularization
- Optional rsync for faster/incremental uploads (for unix systems)
- regular FTP support
- improved Windows support
- integration with tools like 1password or LastPass

## License

MIT, see [LICENSE.md](http://github.com/Jam3/uploadr/blob/master/LICENSE.md) for details.
