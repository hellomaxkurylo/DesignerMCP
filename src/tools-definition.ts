export const TOOLS_DEFINITION = [
  {
    name: "create_element",
    description: "Create a new element in the Webflow Designer. This is the primary tool for adding new content to the page. Use this when you need to add new structural or content elements.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create. For layout, use Section, DivBlock, or Grid. For text, use Heading or Paragraph.",
          enum: ["Animation", "BackgroundVideoWrapper", "BlockContainer", "Blockquote", "Button", "CodeBlock", "DivBlock", "DOM", "DropdownWrapper", "DynamoWrapper", "Facebook", "Grid", "Heading", "HFlex", "VFlex", "HtmlEmbed", "Image", "LightboxWrapper", "LinkBlock", "List", "ListItem", "MapWidget", "NavbarWrapper", "Pagination", "Paragraph", "QuickStack", "RichText", "Row", "Section", "SliderWrapper", "Spline", "TabsWrapper", "TextBlock", "TextLink", "Twitter", "Video", "YouTubeVideo", "CommerceAddToCartWrapper", "CommerceCartQuickCheckoutActions", "CommerceCartWrapper", "CommerceCheckoutAdditionalInfoSummaryWrapper", "CommerceCheckoutAdditionalInputsContainer", "CommerceCheckoutCustomerInfoSummaryWrapper", "CommerceCheckoutDiscounts", "CommerceCheckoutFormContainer", "CommerceCheckoutOrderItemsWrapper", "CommerceCheckoutOrderSummaryWrapper", "CommerceCheckoutPaymentSummaryWrapper", "CommerceCheckoutShippingSummaryWrapper", "CommerceDownloadsWrapper", "CommerceOrderConfirmationContainer", "CommercePayPalCheckoutButton", "CommercePaypalCheckoutFormContainer", "FormBlockLabel", "FormButton", "FormCheckboxInput", "FormFileUploadWrapper", "FormForm", "FormRadioInput", "FormReCaptcha", "FormSelect", "FormTextarea", "FormTextInput", "LogIn", "ResetPassword", "SignUp", "UpdatePassword", "UserAccount", "UserAccountSubscriptionList", "UserLogOutLogIn", "IX2InstanceFactoryOnClass", "IX2InstanceFactoryOnElement", "SearchForm", "LayoutFeaturesList", "LayoutFeaturesMetrics", "LayoutFeaturesTable", "LayoutFooterDark", "LayoutFooterLight", "LayoutFooterSubscribe", "LayoutGalleryOverview", "LayoutGalleryScroll", "LayoutGallerySlider", "LayoutHeroHeadingCenter", "LayoutHeroHeadingLeft", "LayoutHeroHeadingRight", "LayoutHeroStack", "LayoutHeroSubscribeLeft", "LayoutHeroSubscribeRight", "LayoutHeroWithoutImage", "LayoutLogosQuoteBlock", "LayoutLogosQuoteDivider", "LayoutLogosTitleLarge", "LayoutLogosTitleSmall", "LayoutLogosWithoutTitle", "LayoutNavbarLogoCenter", "LayoutNavbarLogoLeft", "LayoutNavbarNoShadow", "LayoutPricingComparison", "LayoutPricingItems", "LayoutPricingOverview", "LayoutTeamCircles", "LayoutTeamSlider", "LayoutTestimonialColumnDark", "LayoutTestimonialColumnLight", "LayoutTestimonialImageLeft", "LayoutTestimonialSliderLarge", "LayoutTestimonialSliderSmall", "LayoutTestimonialStack", "StructureLayoutQuickStack1plus2", "StructureLayoutQuickStack1x1", "StructureLayoutQuickStack2plus1", "StructureLayoutQuickStack2x1", "StructureLayoutQuickStack2x2", "StructureLayoutQuickStack3x1", "StructureLayoutQuickStack4x1", "StructureLayoutQuickStackMasonry"]
        },
        insertMethod: {
          type: "string",
          description: "Method to insert the element relative to the target. 'append' is most common.",
          enum: ["append", "prepend", "before", "after"]
        },
        targetElementId: {
          type: "string",
          description: "ID of the element to insert relative to. Required for 'before'/'after', optional for 'append'/'prepend' (defaults to selected element)."
        },
        textContent: {
          type: "string",
          description: "Text content for elements that support it (e.g., Heading, Paragraph)."
        }
      },
      required: ["elementType"]
    }
  },
  {
    name: "get_selected_element",
    description: "Get details of the currently selected element in the Designer. Use this to find the context for other operations.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "set_selected_element",
    description: "Set the currently selected element in the Designer using its ID.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to select."
        }
      },
      required: ["elementId"]
    }
  },
  {
    name: "remove_element",
    description: "Remove an element from the page by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to remove."
        }
      },
      required: ["elementId"]
    }
  },
  {
    name: "get_all_elements",
    description: "Get a list of all elements on the current page. Useful for finding element IDs.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "set_text_content",
    description: "Set the text content of a given element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element whose text content will be set."
        },
        textContent: {
          type: "string",
          description: "The new text content."
        }
      },
      required: ["elementId", "textContent"]
    }
  },
  {
    name: "get_text_content",
    description: "Get the text content of a given element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to get text content from."
        }
      },
      required: ["elementId"]
    }
  },
  {
    name: "insert_element_before",
    description: "Insert a new element before a specified target element.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create."
        },
        targetElementId: {
          type: "string",
          description: "The ID of the element to insert before."
        },
        textContent: {
          type: "string",
          description: "Optional text content for the new element."
        }
      },
      required: ["elementType", "targetElementId"]
    }
  },
  {
    name: "insert_element_after",
    description: "Insert a new element after a specified target element.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create."
        },
        targetElementId: {
          type: "string",
          description: "The ID of the element to insert after."
        },
        textContent: {
          type: "string",
          description: "Optional text content for the new element."
        }
      },
      required: ["elementType", "targetElementId"]
    }
  },
  {
    name: "append_element",
    description: "Append a new element as a child of a specified parent element.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create."
        },
        parentElementId: {
          type: "string",
          description: "The ID of the element to append the new element to."
        },
        textContent: {
          type: "string",
          description: "Optional text content for the new element."
        }
      },
      required: ["elementType", "parentElementId"]
    }
  },
  {
    name: "prepend_element",
    description: "Prepend a new element as a child of a specified parent element.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create."
        },
        parentElementId: {
          type: "string",
          description: "The ID of the element to prepend the new element to."
        },
        textContent: {
          type: "string",
          description: "Optional text content for the new element."
        }
      },
      required: ["elementType", "parentElementId"]
    }
  },
  {
    name: "get_current_page",
    description: "Get details of the current page in the Designer.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_current_breakpoint",
    description: "Get the current responsive breakpoint being viewed in the Designer.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_site_info",
    description: "Get information about the current Webflow site.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "notify_user",
    description: "Send a notification to the user in the Webflow Designer interface.",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to display in the notification."
        },
        type: {
          type: "string",
          enum: ["info", "success", "warning", "error"],
          description: "The type of notification to display."
        }
      },
      required: ["message"]
    }
  },
  {
    name: "create_component_instance",
    description: "Create an instance of a Webflow component.",
    inputSchema: {
      type: "object",
      properties: {
        componentId: {
          type: "string",
          description: "The ID of the component to instantiate."
        },
        parentElementId: {
          type: "string",
          description: "ID of the parent to append the component to. Defaults to selected element."
        },
        insertMethod: {
          type: "string",
          enum: ["append", "prepend", "before", "after"],
          description: "Method to insert the component instance."
        }
      },
      required: ["componentId"]
    }
  },
  {
    name: "list_components",
    description: "List all available components in the site.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "upload_asset",
    description: "Upload a new asset (e.g., image) to the Webflow project.",
    inputSchema: {
      type: "object",
      properties: {
        assetData: {
          type: "string",
          description: "Base64 encoded data of the asset to upload."
        },
        fileName: {
          type: "string",
          description: "The file name for the asset (e.g., 'image.png')."
        },
        altText: {
          type: "string",
          description: "Optional alt text for the asset."
        }
      },
      required: ["assetData", "fileName"]
    }
  },
  {
    name: "set_image_asset",
    description: "Set the image source for an Image element using an asset ID.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the Image element."
        },
        assetId: {
          type: "string",
          description: "The ID of the asset to use for the image."
        },
        altText: {
          type: "string",
          description: "Optional alt text for the image."
        }
      },
      required: ["elementId", "assetId"]
    }
  },
  {
    name: "create_semantic_class",
    description: "Create a new semantic CSS class with specified styles. This is the foundation of styling in Webflow.",
    inputSchema: {
      type: "object",
      properties: {
        className: {
          type: "string",
          description: "The name of the class to create (e.g., 'primary-button')."
        },
        styles: {
          type: "object",
          description: "A map of CSS properties (kebab-case) and their values.",
          additionalProperties: { type: "string" }
        },
        description: {
          type: "string",
          description: "Optional description of what the class is for."
        }
      },
      required: ["className", "styles"]
    }
  },
  {
    name: "apply_semantic_class",
    description: "Apply an existing semantic class to an element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to apply the class to."
        },
        className: {
          type: "string",
          description: "The name of the semantic class to apply."
        },
        replace: {
          type: "boolean",
          description: "If true, replaces all existing classes on the element. Defaults to false."
        }
      },
      required: ["elementId", "className"]
    }
  },
  {
    name: "apply_multiple_classes",
    description: "Apply multiple existing semantic classes to an element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to apply classes to."
        },
        classNames: {
          type: "array",
          items: {
            type: "string"
          },
          description: "An array of semantic class names to apply."
        },
        replace: {
          type: "boolean",
          description: "If true, replaces all existing classes on the element. Defaults to false."
        }
      },
      required: ["elementId", "classNames"]
    }
  },
  {
    name: "list_semantic_classes",
    description: "List all available semantic classes in the project.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Optional filter to search for specific class names."
        }
      },
      required: []
    }
  },
  {
    name: "get_semantic_class_properties",
    description: "Get the CSS properties of a specific semantic class.",
    inputSchema: {
      type: "object",
      properties: {
        className: {
          type: "string",
          description: "The name of the semantic class."
        }
      },
      required: ["className"]
    }
  },
  {
    name: "update_semantic_class",
    description: "Update the styles of an existing semantic class.",
    inputSchema: {
      type: "object",
      properties: {
        className: {
          type: "string",
          description: "The name of the class to update."
        },
        styles: {
          type: "object",
          description: "A map of CSS properties (kebab-case) to update.",
          additionalProperties: { type: "string" }
        },
        merge: {
          type: "boolean",
          description: "If true, merges with existing styles. If false, replaces them. Defaults to true."
        }
      },
      required: ["className", "styles"]
    }
  },
  {
    name: "remove_semantic_class",
    description: "Remove a semantic class from the project entirely.",
    inputSchema: {
      type: "object",
      properties: {
        className: {
          type: "string",
          description: "The name of the class to remove."
        }
      },
      required: ["className"]
    }
  },
  {
    name: "get_element_classes",
    description: "Get the list of classes applied to a specific element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element."
        }
      },
      required: ["elementId"]
    }
  },
  {
    name: "remove_class_from_element",
    description: "Remove a specific class from an element.",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element."
        },
        className: {
          type: "string",
          description: "The class name to remove."
        }
      },
      required: ["elementId", "className"]
    }
  },
  {
    name: "create_element_with_classes",
    description: "Create a new element and apply one or more semantic classes in a single step.",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description: "Type of element to create."
        },
        classNames: {
          type: "array",
          items: {
            type: "string"
          },
          description: "An array of semantic class names to apply to the new element."
        },
        insertMethod: {
          type: "string",
          enum: ["append", "prepend", "before", "after"],
          description: "Method to insert the element relative to the target."
        },
        targetElementId: {
          type: "string",
          description: "ID of the element to insert relative to."
        },
        textContent: {
          type: "string",
          description: "Optional text content for the new element."
        }
      },
      required: ["elementType", "classNames"]
    }
  }
]; 