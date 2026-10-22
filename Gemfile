source "https://rubygems.org"

# Match GitHub Pages' Jekyll series without pulling in unused remote themes
# and the vulnerable rubyzip version required by the github-pages meta-gem.
gem "jekyll", "~> 3.10.0"
gem "kramdown-parser-gfm", "~> 1.1"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-gist", "~> 1.5"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-redirect-from", "~> 0.16"
  gem "jekyll-sitemap", "~> 1.4"
end

group :test do
  gem "bundler-audit", "~> 0.9", require: false
  gem "minitest", "~> 5.0", require: false
  gem "nokogiri", ">= 1.19.4", "< 2", require: false
end
