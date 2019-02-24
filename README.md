# Frequently Asked Questions

1. What is a writteli?

Writteli is a static site generator, build with [KISS](https://en.wikipedia.org/wiki/KISS_principle) principle in heart.

2. Another static site generator? Why?

Because I can ;) To be honest, I was not satisfied with any available tools and while I was doing another redesign of my [website](https://lukaszkups.net) I decided to create an additional tooling as a side project.

3. What technologies writteli use?

Template language is [pug](https://pugjs.org), it supports ES6 JavaScript syntax as your website scripts and you can choose between traditional CSS, Sass or Sass with indented syntax.

4. Why pug and not Vue? I've heard you are a Vue.js fan?

Yes I am - but this tool is intended to be a STATIC SITE generator, not Single Page one. Besides that, pug is very simple to learn, and still pretty popular.

5. How to use it?

Scroll down and read.

6. Will be there CLI?

Yes.

7. Will be there a GUI version for non-technical people?

Yes.

8. Will be there a mobile app?

Maybe, not yet decided.

9. What's the license?

It's open source MIT. But keeping the `Built with writteli <3` tagline in the footer will be highly appreciated.

10. Is it writteli, Writte.li, or Writteli ?

It's **writteli** (*/ˈrʌɪtəli/*). The [writte.li](https://writte.li) is the domain name of the whole project.

# Getting started

First, fork this repo to your git account, then clone it to your local machine.

Enter the folder of the project and run npm install command:

```
npm i
```

It will install all necessary dependencies.

Rename `config--example.js` file to `config.js` (project root folder) or make a file copy with that name (just in case).

# First run

If you want to see live changes of your website, you can run a local server using command:

```
npm run server
```

It will start local server at `localhost:3000`.

If you want just to compile final version of your website, you can use `compile` method:

```
npm run compile
```

Compiled website contents will be saved at `/output` folder.

# Author

Author of this tool is lukasz kups. You can reach me via [email](mailto:letstalk@lukaszkups.net) or [twitter](https://twitter.com/lukaszkups).

# License

This tool is devleoped and maintained under MIT License.

# Available themes

- [brutalist](./themes/brutalist/)

![img](https://raw.githubusercontent.com/lukaszkups/writteli/master/theme/brutalist/assets/img/home--screenshot.jpg?token=AQuB48s5Kq9qjqtylTqzuLmC9aRIv-Nqks5ce_yAwA%3D%3D)

# Showcase

Websites that are built with writteli (feel free to commit yours!):

- https://writte.li
- https://lukaszkups.net
