require "minitest/autorun"
require "jekyll"
require "nokogiri"

class CommentSecurityTest < Minitest::Test
  def render_comment(fields = {})
    defaults = {"index" => 1, "name" => "Reader", "email" => "a" * 32,
                "date" => nil, "url" => "", "message" => "Hello\nworld"}
    template = Liquid::Template.parse(File.read(File.expand_path("../_includes/comment.html", __dir__)))
    Nokogiri::HTML.fragment(template.render!("include" => defaults.merge(fields)))
  end

  def test_comment_fields_cannot_inject_html
    payload = '<img src=x onerror="alert(1)"><script>alert(1)</script>'
    document = render_comment("name" => payload, "message" => payload,
                              "email" => '\" onerror="alert(1)', "index" => '\" onclick="alert(1)')
    assert_empty document.css("script, [onerror], [onclick]")
    assert_equal payload, document.at_css(".comment__author").text.strip
    assert_equal payload, document.at_css(".comment__message").text
  end

  def test_only_http_and_https_author_links_are_allowed
    ["javascript:alert(1)", " JAVASCRIPT:alert(1)", "java\nscript:alert(1)",
     "data:text/html,<script>alert(1)</script>", "//example.com", "&#106;avascript:alert(1)"].each do |url|
      assert_nil render_comment("url" => url).at_css(".comment__author a"), url
    end
    ["https://example.com", "http://example.com", "HTTPS://example.com"].each do |url|
      assert_equal url, render_comment("url" => url).at_css(".comment__author a")["href"]
    end
    document = render_comment("url" => 'https://example.com/" onclick="alert(1)')
    assert_empty document.css("[onclick]")
  end

  def test_markdown_and_math_cannot_reintroduce_executable_content
    payload = '[click](javascript:alert(1)) ![image](x) \\href{javascript:alert(1)}{click}'
    document = render_comment("message" => payload)
    assert_empty document.css(".comment__message a, .comment__message img")
    assert_equal payload, document.at_css(".comment__message").text
    assert_includes document.at_css("article")["class"].split, "tex2jax_ignore"
    assert_equal 1, render_comment.css(".comment__message br").length
  end
end
