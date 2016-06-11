# uploadr

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

A command-line tool which copies a folder's contents to a server via SFTP. Some features:

- Allows ignore and other pattern matching
- Displays a progress bar for total bytes transferred
- Provides a smooth UX for creating `.env` files (username / password entry)
- Provides clear logging and handles common user errors

## Install

This is best installed as a local devDependency, and set up in a script tag in your project's `package.json`.

```sh
npm i uploadr --save-dev
```

## `.env` config

Usually you need a username and password to connect via SFTP. This tool searches for a `.env` file in your current working directory, and you can `.gitignore` this to ensure that the credentials are not public. The file is JSON and supports comments.

```json
{
  "username": "beep",
  "password": "boop"
}
```

## 

For example, your scripts might look like this:

```json
{
  "upload": "uploadr --host foobar.com --src public/ --dest /home/public_html/",
  "env": "uploadr-env"
}
```

```sh
uploadr [opts]

Options
  --src, -s        local source folder (default cwd)
  --dest, -d       destination folder on remote server
  --host, -h       host for login
  --username, -u   username for login (default 'anonymous')
  --password, -p   password for login (default empty string)
  --port, -p       port to connect (default 22)
  --ignore, -i     pattern(s) to ignore in the upload queue
  --only, -o       pattern(s) to isolate and only upload for this run
  --save, -S       saves .env to cwd and updates .gitignore
  --prompt         always shows user/password prompt
```

## License

MIT, see [LICENSE.md](http://github.com/Jam3/uploadr/blob/master/LICENSE.md) for details.
