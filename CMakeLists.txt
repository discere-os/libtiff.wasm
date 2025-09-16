# CMake build for libtiff
# Run "cmake" to generate the build files for your platform
#
# Copyright © 2015 Open Microscopy Environment / University of Dundee
# Copyright © 2021 Roger Leigh <rleigh@codelibre.net>
# Written by Roger Leigh <rleigh@codelibre.net>
#
# Permission to use, copy, modify, distribute, and sell this software and
# its documentation for any purpose is hereby granted without fee, provided
# that (i) the above copyright notices and this permission notice appear in
# all copies of the software and related documentation, and (ii) the names of
# Sam Leffler and Silicon Graphics may not be used in any advertising or
# publicity relating to the software without the specific, prior written
# permission of Sam Leffler and Silicon Graphics.
#
# THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
# EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
# WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
#
# IN NO EVENT SHALL SAM LEFFLER OR SILICON GRAPHICS BE LIABLE FOR
# ANY SPECIAL, INCIDENTAL, INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND,
# OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
# WHETHER OR NOT ADVISED OF THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF
# LIABILITY, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
# OF THIS SOFTWARE.

cmake_minimum_required(VERSION 3.10)

# Default policy is from 3.10
cmake_policy(VERSION 3.10)

if(POLICY CMP0074)
  # Allow find_package() to use the ZLIB_ROOT variable, if available.
  cmake_policy(SET CMP0074 NEW)
endif()

# Find CMake modules in cmake/
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/cmake")

# Read version information from configure.ac.
include(AutotoolsVersion)
message(STATUS "Building tiff version ${LIBTIFF_VERSION_FULL}")

# Project definition
set(CMAKE_C_STANDARD 99)
project(tiff
        VERSION "${LIBTIFF_VERSION}"
        LANGUAGES C CXX)

#
# WASM-Native Dual Build Architecture (Early Configuration)
# Copyright © 2025 Superstruct Ltd, New Zealand
# Licensed under libtiff license
#
# This must be configured before add_subdirectory() calls
# so that variables are available to subdirectory CMakeLists.txt files
#

# Detect Emscripten build environment
if(EMSCRIPTEN)
    message(STATUS "=== WASM-Native Build Configuration ===")

    # Build type configuration
    option(BUILD_SIDE_MODULE "Build SIDE_MODULE for dynamic loading into host applications" ON)
    option(BUILD_MAIN_MODULE "Build MAIN_MODULE for NPM distribution" ON)

    # SIDE_MODULE configuration
    if(BUILD_SIDE_MODULE)
        message(STATUS "  SIDE_MODULE build:                  ENABLED")
        set(WASM_COMPAT_SIDE_SOURCE "${CMAKE_SOURCE_DIR}/wasm/wasm_compat_side.c" CACHE INTERNAL "SIDE_MODULE compatibility source")
        add_compile_definitions(LIBTIFF_WASM_SIDE_MODULE=1)
    endif()

    # MAIN_MODULE configuration
    if(BUILD_MAIN_MODULE)
        message(STATUS "  MAIN_MODULE build:                  ENABLED")
        set(WASM_COMPAT_MAIN_SOURCE "${CMAKE_SOURCE_DIR}/wasm/wasm_compat_main.c" CACHE INTERNAL "MAIN_MODULE compatibility source")
        add_compile_definitions(LIBTIFF_WASM_MAIN_MODULE=1)
    endif()

    message(STATUS "=== Early WASM Configuration Complete ===")
    message(STATUS "")
endif()

if(NOT CMAKE_SOURCE_DIR STREQUAL PROJECT_SOURCE_DIR)
  # libtiff is being included as a subproject of some other project.
  set(TIFF_INSTALL_DEFAULT OFF)
else()
  set(TIFF_INSTALL_DEFAULT ON)
  option(BUILD_SHARED_LIBS "Build shared libraries" ON)
endif()

if (BUILD_SHARED_LIBS)
  set(TIFF_STATIC_LIBS_DEFAULT FALSE)
else()
  set(TIFF_STATIC_LIBS_DEFAULT TRUE)
 endif()

option(tiff-static "build TIFF static libraries" ${TIFF_STATIC_LIBS_DEFAULT})
option(tiff-tools "build TIFF tools" ON)
option(tiff-tests "build TIFF tests" ON)
option(tiff-contrib "build TIFF contrib" ON)
option(tiff-docs "build TIFF documentation" ON)
option(tiff-deprecated "build TIFF deprecated features" OFF)
option(tiff-install "install TIFF targets" ${TIFF_INSTALL_DEFAULT})

if (tiff-static)
  set(TIFF_BUILD_LIB_VALUE STATIC)
else()
  set(TIFF_BUILD_LIB_VALUE SHARED)
endif()

# Disable deprecated features to ensure clean build
if (tiff-deprecated)
  add_definitions(-DTIFF_DISABLE_DEPRECATED)
endif()

# Autotools compatibility
include(AutotoolsCompat)

# Compiler checks (warning flags, etc.)
include(CompilerChecks)

# Linker checks (version script, etc.)
include(LinkerChecks)

# Processor checks (endianness, fill order, floating point, etc.)
include(ProcessorChecks)

# Checks for headers
include(IncludeChecks)

# Checks for functions and other symbols
include(SymbolChecks)

# Standard installation paths
include(GNUInstallDirs)
# Documentation install directory (default to cmake project docdir)
set(LIBTIFF_DOCDIR "${CMAKE_INSTALL_DOCDIR}")

# CTest testing
enable_testing()

# Checks for type presence and size
include(TypeSizeChecks)

# Check for POSIX Large File Support (LFS)
include(LargeFileSupport)

# Options for internal codec support
include(InternalCodecs)

# Check for Deflate codec
include(DeflateCodec)

# Check for PixarLog codec
include(PixarLogCodec)

# Check for JPEG codec
include(JPEGCodec)

# Check for JBIG codec
include(JBIGCodec)

# Check for LERC codec
include(LERCCodec)

# Check for LZMA codec
include(LZMACodec)

# Check for ZSTD codec
include(ZSTDCodec)

# Check for WebP codec
include(WebPCodec)

# Option for C++ libtiffxx library
include(CXXLibrary)

# Checks for OpenGL support
include(OpenGLChecks)

# Windows support
include(WindowsSupport)

# Orthogonal features
include(LibraryFeatures)


# math.h/libm portability
find_package(CMath REQUIRED)

# Release support
include(Release)

# Process subdirectories
add_subdirectory(port)
add_subdirectory(libtiff)
if(tiff-tools)
  add_subdirectory(tools)
endif()
if(tiff-tests)
  add_subdirectory(test)
endif()
if(tiff-contrib)
  add_subdirectory(contrib)
endif()
add_subdirectory(build)
if(tiff-docs)
  add_subdirectory(doc)
endif()

# pkg-config support
include(PkgConfig)

message(STATUS "")
message(STATUS "Libtiff is now configured for ${CMAKE_SYSTEM}")
message(STATUS "")
if (NOT LIBTIFF_RELEASE_VERSION STREQUAL LIBTIFF_VERSION_FULL)
  message(STATUS "  Libtiff release version      ${LIBTIFF_RELEASE_VERSION} is not equal to build version!")
endif()
message(STATUS "  Libtiff build version:       ${LIBTIFF_VERSION_FULL}")
message(STATUS "  Libtiff library version:     ${SO_VERSION}")
message(STATUS "  Libtiff release date:        ${LIBTIFF_RELEASE_DATE}")
message(STATUS "")
message(STATUS "  Installation directory:             ${prefix}")
message(STATUS "  Documentation directory:            ${LIBTIFF_DOCDIR}")
message(STATUS "  C compiler:                         ${CMAKE_C_COMPILER}")
message(STATUS "  C++ compiler:                       ${CMAKE_CXX_COMPILER}")
message(STATUS "  Build shared libraries:             ${BUILD_SHARED_LIBS}")
message(STATUS "  Build tools:                        ${tiff-tools}")
message(STATUS "  Build tests:                        ${tiff-tests}")
message(STATUS "  Build contrib:                      ${tiff-contrib}")
message(STATUS "  Build docs:                         ${tiff-docs}")
message(STATUS "  Build deprecated features:          ${tiff-deprecated}")
message(STATUS "  Enable linker symbol versioning:    ${HAVE_LD_VERSION_SCRIPT}")
message(STATUS "  Support Microsoft Document Imaging: ${mdi}")
message(STATUS "  Use win32 IO:                       ${USE_WIN32_FILEIO}")
message(STATUS "")
message(STATUS " Support for internal codecs:")
message(STATUS "  CCITT Group 3 & 4 algorithms:       ${ccitt}")
message(STATUS "  Macintosh PackBits algorithm:       ${packbits}")
message(STATUS "  LZW algorithm:                      ${lzw}")
message(STATUS "  ThunderScan 4-bit RLE algorithm:    ${thunder}")
message(STATUS "  NeXT 2-bit RLE algorithm:           ${next}")
message(STATUS "  LogLuv high dynamic range encoding: ${logluv}")
message(STATUS "")
message(STATUS " Support for external codecs:")
message(STATUS "  ZLIB support:                       Requested:${zlib} Availability:${ZLIB_FOUND} Support:${ZLIB_SUPPORT}")
if(ZLIB_SUPPORT)
  message(STATUS "  libdeflate support:                 Requested:${libdeflate} Availability:${DEFLATE_FOUND} Support:${LIBDEFLATE_SUPPORT}")
else()
  message(STATUS "  libdeflate support:                 Requested:${libdeflate} Availability:${DEFLATE_FOUND} Support:${LIBDEFLATE_SUPPORT} (Depends on ZLIB Support)")
endif()
if(ZLIB_SUPPORT)
  message(STATUS "  Pixar log-format algorithm:         Requested:${pixarlog} Availability:${ZLIB_FOUND} Support:${PIXARLOG_SUPPORT}")
else()
  message(STATUS "  Pixar log-format algorithm:         Requested:${pixarlog} Availability:${ZLIB_FOUND} Support:${PIXARLOG_SUPPORT} (Depends on ZLIB Support)")
endif()
message(STATUS "  JPEG support:                       Requested:${jpeg} Availability:${JPEG_FOUND} Support:${JPEG_SUPPORT}")
if(JPEG_SUPPORT)
  message(STATUS "  Old JPEG support:                   Requested:${old-jpeg} Availability:${JPEG_SUPPORT} Support:${OJPEG_SUPPORT}")
else()
  message(STATUS "  Old JPEG support:                   Requested:${old-jpeg} Availability:${JPEG_SUPPORT} Support:${OJPEG_SUPPORT} (Depends on JPEG Support)")
endif()
if(JPEG_SUPPORT AND HAVE_JPEGTURBO_DUAL_MODE_8_12)
  message(STATUS "  JPEG 8/12 bit dual mode:            Support: yes (libjpeg turbo >= 3.0 dual mode)")
else()
  message(STATUS "  JPEG 8/12 bit dual mode:            Requested:${jpeg12} Availability:${JPEG12_FOUND} Support:${JPEG_DUAL_MODE_8_12}")
endif()
message(STATUS "  ISO JBIG support:                   Requested:${jbig} Availability:${JBIG_FOUND} Support:${JBIG_SUPPORT}")
if(ZLIB_SUPPORT)
  message(STATUS "  LERC support:                       Requested:${lerc} Availability:${LERC_FOUND} Support:${LERC_SUPPORT}")
else()
  message(STATUS "  LERC support:                       Requested:${lerc} Availability:${LERC_FOUND} Support:${LERC_SUPPORT} (Depends on ZLIB Support)")
endif()
message(STATUS "  LZMA2 support:                      Requested:${lzma} Availability:${liblzma_FOUND} Support:${LZMA_SUPPORT}")
message(STATUS "  ZSTD support:                       Requested:${zstd} Availability:${ZSTD_USABLE} Support:${ZSTD_SUPPORT}")
message(STATUS "  WEBP support:                       Requested:${webp} Availability:${WebP_FOUND} Support:${WEBP_SUPPORT}")
message(STATUS "")
message(STATUS "  C++ support:                        ${tiff-cxx} (requested) ${CXX_SUPPORT} (availability)")
message(STATUS "")
# message(STATUS "  X Athena Widgets support:           ${HAVE_XAW}")
message(STATUS "  OpenGL support:                     Requested:${tiff-opengl} Availability:${HAVE_OPENGL} Support:${OPENGL_SUPPORT}")
message(STATUS "")

#
# WASM-Native Dual Build Architecture
# Copyright © 2025 Superstruct Ltd, New Zealand
# Licensed under libtiff license
#
# WASM builds with maximum browser API utilization
# Standalone library for dynamic loading architecture
#

# Detect Emscripten build environment
if(EMSCRIPTEN)
    message(STATUS "=== WASM-Native Build Configuration ===")

    # Build type configuration
    option(BUILD_SIDE_MODULE "Build SIDE_MODULE for dynamic loading into host applications" ON)
    option(BUILD_MAIN_MODULE "Build MAIN_MODULE for NPM distribution" ON)

    # Maximum feature enablement - no browser compatibility concerns
    set(WASM_COMMON_FLAGS
        "-msimd128"              # SIMD instructions (WebGPU+SIMD browsers only)
        "-pthread"               # Threading with SharedArrayBuffer
        "-fPIC"                  # Position independent code for dynamic loading
        "-O3"                    # Maximum optimization
        "-flto"                  # Link-time optimization
        "-DNDEBUG"              # Release build optimizations
    )

    # Native-level browser API integration
    set(WASM_LINK_FLAGS_COMMON
        "-s ALLOW_MEMORY_GROWTH=1"        # Dynamic memory management
        "-s FORCE_FILESYSTEM=1"           # Full filesystem API access
        "-s USE_PTHREADS=1"              # Threading support
        "-s SHARED_MEMORY=1"             # SharedArrayBuffer for zero-copy
        "-s ASYNCIFY=1"                  # Async/await in C/C++
        "-s DISABLE_EXCEPTION_CATCHING=1" # Performance optimization
        "-s INITIAL_MEMORY=64MB"         # Generous initial allocation for TIFF processing
        "-s MAXIMUM_MEMORY=4GB"          # No artificial memory limits
        "-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency" # Utilize all CPU cores
    )

    # Graphics and imaging specific features for TIFF processing
    list(APPEND WASM_LINK_FLAGS_COMMON
        "-s USE_WEBGPU=1"               # WebGPU compute for parallel TIFF processing
    )

    message(STATUS "  WASM SIMD support:                  ENABLED (msimd128)")
    message(STATUS "  WASM Threading:                     ENABLED (pthreads + SharedArrayBuffer)")
    message(STATUS "  WASM WebGPU:                        ENABLED (compute shaders)")
    message(STATUS "  WASM Memory limits:                 4GB maximum, 64MB initial")

    # SIDE_MODULE: Hosted by main application, exclude system libraries
    if(BUILD_SIDE_MODULE)
        message(STATUS "  SIDE_MODULE build:                  ENABLED")

        set(WASM_LINK_FLAGS_SIDE
            "-s SIDE_MODULE=1"
            # System libraries provided by host MAIN_MODULE
            # NEVER link zlib, jpeg, webp - use dynamic SIDE_MODULEs via dlopen()
        )

        # Create SIDE_MODULE target with maximum features
        add_custom_target(build_side_module
            COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_CURRENT_BINARY_DIR}/build-dual-side
            COMMAND ${CMAKE_COMMAND}
                -DCMAKE_TOOLCHAIN_FILE=${CMAKE_TOOLCHAIN_FILE}
                -DCMAKE_BUILD_TYPE=Release
                -DBUILD_SIDE_MODULE=ON
                -DBUILD_MAIN_MODULE=OFF
                -S ${CMAKE_SOURCE_DIR}
                -B ${CMAKE_CURRENT_BINARY_DIR}/build-dual-side
            COMMAND ${CMAKE_COMMAND} --build ${CMAKE_CURRENT_BINARY_DIR}/build-dual-side --parallel
            COMMENT "Building SIDE_MODULE with native-level features for dynamic loading"
        )

        list(APPEND WASM_COMPILE_FLAGS ${WASM_COMMON_FLAGS})
        list(APPEND WASM_LINK_FLAGS ${WASM_LINK_FLAGS_COMMON} ${WASM_LINK_FLAGS_SIDE})
        add_compile_definitions(LIBTIFF_WASM_SIDE_MODULE=1)

        # SIDE_MODULE compatibility layer will be added after main library target is defined
        set(WASM_COMPAT_SIDE_SOURCE "${CMAKE_SOURCE_DIR}/wasm/wasm_compat_side.c" CACHE INTERNAL "")
    endif()

    # MAIN_MODULE: Self-contained for NPM packages
    if(BUILD_MAIN_MODULE)
        message(STATUS "  MAIN_MODULE build:                  ENABLED")

        set(WASM_LINK_FLAGS_MAIN
            "-s MAIN_MODULE=1"
            "-s MODULARIZE=1"
            "-s EXPORT_ES6=1"
            "-s EXPORT_NAME=LibTIFFWASM"
            # Include ALL system libraries for standalone usage
            "-s USE_ZLIB=1"
            "-s USE_LIBJPEG=1"
            # Advanced features for maximum performance
            "--closure=1"                 # Google Closure Compiler optimization
            "-s PROXY_TO_PTHREAD=1"      # Main thread responsiveness
        )

        # Create MAIN_MODULE target with full feature set
        add_custom_target(build_main_module
            COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_CURRENT_BINARY_DIR}/build-dual-main
            COMMAND ${CMAKE_COMMAND}
                -DCMAKE_TOOLCHAIN_FILE=${CMAKE_TOOLCHAIN_FILE}
                -DCMAKE_BUILD_TYPE=Release
                -DBUILD_SIDE_MODULE=OFF
                -DBUILD_MAIN_MODULE=ON
                -S ${CMAKE_SOURCE_DIR}
                -B ${CMAKE_CURRENT_BINARY_DIR}/build-dual-main
            COMMAND ${CMAKE_COMMAND} --build ${CMAKE_CURRENT_BINARY_DIR}/build-dual-main --parallel
            COMMENT "Building MAIN_MODULE with all system libraries for NPM distribution"
        )

        list(APPEND WASM_COMPILE_FLAGS ${WASM_COMMON_FLAGS})
        list(APPEND WASM_LINK_FLAGS ${WASM_LINK_FLAGS_COMMON} ${WASM_LINK_FLAGS_MAIN})
        add_compile_definitions(LIBTIFF_WASM_MAIN_MODULE=1)

        # MAIN_MODULE compatibility layer will be added after main library target is defined
        set(WASM_COMPAT_MAIN_SOURCE "${CMAKE_SOURCE_DIR}/wasm/wasm_compat_main.c" CACHE INTERNAL "")
    endif()

    # Apply WASM flags to all targets
    if(WASM_COMPILE_FLAGS)
        add_compile_options(${WASM_COMPILE_FLAGS})
    endif()

    if(WASM_LINK_FLAGS)
        add_link_options(${WASM_LINK_FLAGS})
    endif()

    # Dual build target for complete ecosystem
    add_custom_target(build_dual_all
        DEPENDS build_side_module build_main_module
        COMMENT "Building complete dual WASM architecture (SIDE + MAIN modules)"
    )

    message(STATUS "=== End WASM Configuration ===")
    message(STATUS "")

endif()
