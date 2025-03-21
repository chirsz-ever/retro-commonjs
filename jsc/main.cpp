#include <JavaScriptCore/JavaScript.h>
#include <JavaScriptCore/JavaScriptCore.h>
#include <cstdio>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <readline/history.h>
#include <readline/readline.h>
#include <sstream>
#include <string>
#include <sys/syslimits.h>
#include <unistd.h>
#include <vector>

static std::string read_file_content(const char *path) {
  FILE *f = fopen(path, "rb");
  if (f == nullptr) {
    fprintf(stderr, "open %s failed: %s\n", path, strerror(errno));
    exit(1);
  }

  if (fseek(f, 0, SEEK_END) != 0) {
    fprintf(stderr, "fseek failed: %s\n", strerror(errno));
    exit(1);
  }

  size_t length = ftell(f);

  if (fseek(f, 0, SEEK_SET) != 0) {
    fprintf(stderr, "fseek failed: %s\n", strerror(errno));
    exit(1);
  }

  std::string content(length, '\0');

  if (fread(&content[0], 1, length, f) != length) {
    fprintf(stderr, "fread failed: %s\n", strerror(errno));
    exit(1);
  }

  return content;
}

static std::string jsstr_to_utf8(JSStringRef s) {
  size_t length = JSStringGetMaximumUTF8CStringSize(s);
  std::string utf8str(length, '\0');
  size_t writed = JSStringGetUTF8CString(s, &utf8str[0], length + 1);
  utf8str.resize(writed - 1);
  return utf8str;
}

static JSValueRef js_print(JSContextRef ctx, JSObjectRef function,
                           JSObjectRef thisObject, size_t argumentCount,
                           const JSValueRef arguments[],
                           JSValueRef *exception) {
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef result_str = JSValueToStringCopy(ctx, arg, exception);
    if (result_str) {
      printf("%s", jsstr_to_utf8(result_str).c_str());
      JSStringRelease(result_str);
    }
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef js_eprint(JSContextRef ctx, JSObjectRef function,
                            JSObjectRef thisObject, size_t argumentCount,
                            const JSValueRef arguments[],
                            JSValueRef *exception) {
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef result_str = JSValueToStringCopy(ctx, arg, exception);
    if (result_str) {
      fprintf(stderr, "%s\n", jsstr_to_utf8(result_str).c_str());
      JSStringRelease(result_str);
    }
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef js_isFile(JSContextRef ctx, JSObjectRef function,
                            JSObjectRef thisObject, size_t argumentCount,
                            const JSValueRef arguments[],
                            JSValueRef *exception) {
  bool result = false;
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef path_str = JSValueToStringCopy(ctx, arg, exception);
    if (path_str) {
      std::string path = jsstr_to_utf8(path_str);
      if (std::filesystem::exists(path) &&
          std::filesystem::is_regular_file(path)) {
        result = true;
      }
      JSStringRelease(path_str);
    }
  }
  return JSValueMakeBoolean(ctx, result);
}

static JSValueRef js_isDirectory(JSContextRef ctx, JSObjectRef function,
                                 JSObjectRef thisObject, size_t argumentCount,
                                 const JSValueRef arguments[],
                                 JSValueRef *exception) {
  bool result = false;
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef path_str = JSValueToStringCopy(ctx, arg, exception);
    if (path_str) {
      std::string path = jsstr_to_utf8(path_str);
      if (std::filesystem::exists(path) &&
          std::filesystem::is_directory(path)) {
        result = true;
      }
      JSStringRelease(path_str);
    }
  }
  return JSValueMakeBoolean(ctx, result);
}

static JSValueRef js_loadFile(JSContextRef ctx, JSObjectRef function,
                              JSObjectRef thisObject, size_t argumentCount,
                              const JSValueRef arguments[],
                              JSValueRef *exception) {
  JSValueRef result = JSValueMakeUndefined(ctx);
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef path_str = JSValueToStringCopy(ctx, arg, exception);
    if (path_str) {
      std::string path = jsstr_to_utf8(path_str);
      if (std::filesystem::exists(path) &&
          std::filesystem::is_regular_file(path)) {
        std::ifstream fin(path);
        if (fin) {
          std::stringstream strStream;
          strStream << fin.rdbuf();
          JSStringRef result_str =
              JSStringCreateWithUTF8CString(strStream.str().c_str());
          result = JSValueMakeString(ctx, result_str);
        }
      }
      JSStringRelease(path_str);
    }
  }
  return result;
}

static JSValueRef js_realPath(JSContextRef ctx, JSObjectRef function,
                              JSObjectRef thisObject, size_t argumentCount,
                              const JSValueRef arguments[],
                              JSValueRef *exception) {
  JSValueRef result = JSValueMakeUndefined(ctx);
  if (argumentCount > 0) {
    const JSValueRef arg = arguments[0];
    JSStringRef path_str = JSValueToStringCopy(ctx, arg, exception);
    if (path_str) {
      std::string path = jsstr_to_utf8(path_str);
      char resolved_path[PATH_MAX];
      if (realpath(path.c_str(), resolved_path) != nullptr) {
        JSStringRef result_str = JSStringCreateWithUTF8CString(resolved_path);
        result = JSValueMakeString(ctx, result_str);
      }
      JSStringRelease(path_str);
    }
  }
  return result;
}

static JSValueRef js_cwd(JSContextRef ctx, JSObjectRef function,
                         JSObjectRef thisObject, size_t argumentCount,
                         const JSValueRef arguments[], JSValueRef *exception) {
  JSValueRef result = JSValueMakeUndefined(ctx);
  char cwd[PATH_MAX];
  if (getcwd(cwd, sizeof(cwd)) != nullptr) {
    JSStringRef result_str = JSStringCreateWithUTF8CString(cwd);
    result = JSValueMakeString(ctx, result_str);
  }
  return result;
}

void set_args(JSContextRef ctx, JSObjectRef builtin_obj, int argc,
              char *argv[]) {
  std::vector<JSValueRef> arguments;
  for (int i = 1; i < argc; i++) {
    JSStringRef arg_str = JSStringCreateWithUTF8CString(argv[i]);
    arguments.push_back(JSValueMakeString(ctx, arg_str));
  }
  JSObjectRef args = JSObjectMakeArray(
      ctx, argc - 1, argc == 1 ? nullptr : arguments.data(), nullptr);
  JSObjectSetProperty(ctx, builtin_obj, JSStringCreateWithUTF8CString("args"),
                      args, kJSPropertyAttributeReadOnly, nullptr);
}

#define set_member_fn(ctx, obj, name, fn)                                      \
  JSObjectSetProperty(ctx, obj, JSStringCreateWithUTF8CString(name),           \
                      JSObjectMakeFunctionWithCallback(                        \
                          jsctx, JSStringCreateWithUTF8CString(name), fn),     \
                      kJSPropertyAttributeReadOnly, nullptr);

static JSGlobalContextRef make_global_ctx(int argc, char *argv[]) {
  JSGlobalContextRef jsctx = JSGlobalContextCreate(nullptr);

  JSObjectRef gobj = JSContextGetGlobalObject(jsctx);
  JSObjectRef builtin_obj = JSObjectMake(jsctx, nullptr, nullptr);

  set_member_fn(jsctx, builtin_obj, "print", js_print);
  set_member_fn(jsctx, builtin_obj, "eprint", js_eprint);
  set_member_fn(jsctx, builtin_obj, "isFile", js_isFile);
  set_member_fn(jsctx, builtin_obj, "isDirectory", js_isDirectory);
  set_member_fn(jsctx, builtin_obj, "loadFile", js_loadFile);
  set_member_fn(jsctx, builtin_obj, "realPath", js_realPath);
  set_member_fn(jsctx, builtin_obj, "cwd", js_cwd);

  set_args(jsctx, builtin_obj, argc, argv);

  JSObjectSetProperty(jsctx, gobj, JSStringCreateWithUTF8CString("__builtin"),
                      builtin_obj, kJSPropertyAttributeReadOnly, nullptr);

  return jsctx;
}

static void run_repl(JSGlobalContextRef jsctx) {
  JSValueRef exception_obj = nullptr;

  while (char *line = readline("> ")) {
    JSStringRef line_str = JSStringCreateWithUTF8CString(line);
    JSValueRef result =
        JSEvaluateScript(jsctx, line_str, NULL, nullptr, 1, &exception_obj);
    if (exception_obj) {
      JSStringRef exception_str =
          JSValueToStringCopy(jsctx, exception_obj, nullptr);
      fprintf(stderr, "Uncaught %s\n", jsstr_to_utf8(exception_str).c_str());
      JSStringRelease(exception_str);
      exception_obj = nullptr;
    }
    if (result) {
      if (!JSValueIsUndefined(jsctx, result)) {
        JSStringRef result_str = JSValueToStringCopy(jsctx, result, nullptr);
        if (result_str)
          printf("%s\n", jsstr_to_utf8(result_str).c_str());
        JSStringRelease(result_str);
      }
    }
    add_history(line);
  }
}

void run_file(JSGlobalContextRef jsctx, const char *path) {
  JSValueRef exception_obj = nullptr;

  std::string filecontent = read_file_content(path);

  JSGlobalContextSetInspectable(jsctx, true);

  JSStringRef script_str = JSStringCreateWithUTF8CString(filecontent.c_str());
  JSStringRef path_str = JSStringCreateWithUTF8CString(path);

  JSEvaluateScript(jsctx, script_str, NULL, path_str, 1, &exception_obj);

  if (exception_obj) {
    JSStringRef exception_str =
        JSValueToStringCopy(jsctx, exception_obj, nullptr);
    fprintf(stderr, "Uncaught %s\n", jsstr_to_utf8(exception_str).c_str());
    JSStringRelease(exception_str);
  }

  JSStringRelease(path_str);
  JSStringRelease(script_str);
}

int main(int argc, char *argv[]) {
  JSGlobalContextRef jsctx = make_global_ctx(argc, argv);

  if (argc == 1) {
    run_repl(jsctx);
    return 0;
  }

  run_file(jsctx, argv[1]);

  return 0;
}
