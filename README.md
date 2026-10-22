A Github Pages template for academic websites. This was forked (then detached) by [Stuart Geiger](https://github.com/staeiou) from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/), which is © 2016 Michael Rose and released under the MIT License. See LICENSE.md.

I think I've got things running smoothly and fixed some major bugs, but feel free to file issues or make pull requests if you want to improve the generic template / theme.

Keep `Gemfile.lock` and `package-lock.json` under version control. Update affected dependencies and run the checks below when a security advisory is reported; deleting a lockfile does not fix a vulnerability.

# Instructions

1. Register a GitHub account if you don't have one and confirm your e-mail (required!)
1. Fork [this repository](https://github.com/academicpages/academicpages.github.io) by clicking the "fork" button in the top right. 
1. Go to the repository's settings (rightmost item in the tabs that start with "Code", should be below "Unwatch"). Rename the repository "[your GitHub username].github.io", which will also be your website's URL.
1. Set site-wide configuration and create content & metadata (see below -- also see [this set of diffs](http://archive.is/3TPas) showing what files were changed to set up [an example site](https://getorg-testacct.github.io) for a user with the username "getorg-testacct")
1. Upload any files (like PDFs, .zip files, etc.) to the files/ directory. They will appear at https://[your GitHub username].github.io/files/example.pdf.  
1. Check status by going to the repository settings, in the "GitHub pages" section
1. (Optional) Use the Jupyter notebooks or python scripts in the `markdown_generator` folder to generate markdown files for publications and talks from a TSV file.

See more info at https://academicpages.github.io/

## To run locally (not on GitHub Pages, to serve on your own computer)

1. Clone the repository and made updates as detailed above
1. Install Ruby 3.3, Bundler, and Node.js 24 or newer.
1. Run `bundle install` and `npm ci --ignore-scripts` to install the locked dependencies.
1. Run `npm run build:js` after changing JavaScript or updating npm dependencies. Commit the regenerated files under `assets/js/` and `talkmap/leaflet_dist/`; GitHub Pages serves these checked-in assets.
1. Run `bundle exec jekyll serve --livereload --host 127.0.0.1` to generate and preview the site locally.

## Security checks

```sh
npm audit
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
bundle exec bundler-audit check --update
bundle exec ruby tests/comment_security_test.rb
bundle exec jekyll build --safe
```

This repository generates a static site and contains no PHP backend or Composer dependencies. The Facebook share link's `.php` path belongs to Facebook.

The JavaScript build uses jQuery 3.7.1 and Magnific Popup 1.2.0, with HTML interpretation disabled for image titles and status messages. Comments are disabled by default; if Staticman is enabled, comment bodies and names are escaped as plain text, and author links accept only HTTP(S) URLs. This intentionally disables Markdown and HTML in comments. Talk-map labels are also rendered as text, and map tiles use HTTPS.

The Gemfile lists only the plugins used by this site. The `github-pages` meta-gem brought in an unused remote-theme dependency requiring `rubyzip < 3`, which is affected by [CVE-2026-85396](https://github.com/rubysec/ruby-advisory-db/blob/master/gems/rubyzip/CVE-2026-85396.yml). Removing that dependency keeps local builds on the GitHub Pages Jekyll series without installing the vulnerable archive extractor. GitHub-managed build environments and hosting settings are administered separately from this repository.

To regenerate map locations, install `geopy` and run `python3 talkmap.py` from the repository root (or run `talkmap.ipynb`). The generator updates only `talkmap/org-locations.js`, preserving the reviewed map template and JavaScript libraries.

# Changelog -- bugfixes and enhancements

There is one logistical issue with a ready-to-fork template theme like academic pages that makes it a little tricky to get bug fixes and updates to the core theme. If you fork this repository, customize it, then pull again, you'll probably get merge conflicts. If you want to save your various .yml configuration files and markdown files, you can delete the repository and fork it again. Or you can manually patch. 

To support this, all changes to the underlying code appear as a closed issue with the tag 'code change' -- get the list [here](https://github.com/academicpages/academicpages.github.io/issues?q=is%3Aclosed%20is%3Aissue%20label%3A%22code%20change%22%20). Each issue thread includes a comment linking to the single commit or a diff across multiple commits, so those with forked repositories can easily identify what they need to patch.
