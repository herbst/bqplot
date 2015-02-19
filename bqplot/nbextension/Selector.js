/* Copyright 2015 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(["./d3", "./Interaction" ], function(d3, InteractionViewModule) {
    "use strict";

    var BaseSelector = InteractionViewModule.Interaction.extend({
        render: function() {
            this.parent = this.options.parent;
            this.el = d3.select(document.createElementNS(d3.ns.prefix.svg, "g"));

            this.width = this.parent.width - this.parent.margin.left - this.parent.margin.right;
            this.height = this.parent.height - this.parent.margin.top - this.parent.margin.bottom;
            this.mark_views_promise = this.populate_mark_views();
        },
        create_listeners: function() {
            this.parent.on("margin_updated", this.relayout, this);
        },
        relayout: function() {
            this.height = this.parent.height - this.parent.margin.top - this.parent.margin.bottom;
            this.width = this.parent.width - this.parent.margin.left - this.parent.margin.right;
        },
        remove: function() {
            this.el.remove();
            BaseSelector.__super__.remove.apply(this);
        },
        populate_mark_views: function() {
            var fig = this.parent;
            var self = this;
            var mark_ids = this.model.get("marks").map(function(mark_model) {
                return mark_model.id; // Model ids of the marks of the selector
            });
            return Promise.all(fig.mark_views.views).then(function(views) {
                var fig_mark_ids = fig.mark_views._models.map(function(mark_model) {
                    return mark_model.id;
                });  // Model ids of the marks in the figure
                var mark_indices = mark_ids.map(function(mark_model_id) {
                    return fig_mark_ids.indexOf(mark_model_id); // look up based on model ids
                });
                self.mark_views = mark_indices.map(function(elem) {
                    return views[elem]; // return the views, based on the assumption that fig.mark_views is an ordered list
                });
            });
        },
    });

    var BaseXSelector = BaseSelector.extend({
        create_scales: function() {
            if(this.scale) {
                this.scale.remove();
            }
            if(this.model.get("scale")) {
                var that = this;
                return this.create_child_view(this.model.get("scale")).then(function(view) {
                    that.scale = view;
                    that.set_range([that.scale]);
                    return view;
                });
            }
        },
        set_range: function(array) {
            for(var iter = 0; iter < array.length; iter++) {
                array[iter].set_range([0, this.width]);
            }
        },
    });

    var BaseXYSelector = BaseSelector.extend({
        create_scales: function() {
            var that = this;
            if(this.x_scale) {
                this.x_scale.remove();
            }
            if(this.y_scale) {
                this.y_scale.remove();
            }
            var scale_promises = [];
            if(this.model.get("x_scale")) {
                scale_promises.push(this.create_child_view(this.model.get("x_scale")).then(function(view) {
                    that.x_scale = view;
                    that.set_x_range([that.x_scale]);
                    return view;
                }));
            }
            if(this.model.get("y_scale")) {
                scale_promises.push(this.create_child_view(this.model.get("y_scale")).then(function(view) {
                    that.y_scale = view;
                    that.set_y_range([that.y_scale]);
                    return view;
                }));
            }

            return Promise.all(scale_promises);
        },
        set_x_range: function(array) {
            for(var iter = 0; iter < array.length; iter++) {
                array[iter].set_range([0, this.width]);
            }
        },
        set_y_range: function(array) {
            for(var iter = 0; iter < array.length; iter++) {
                array[iter].set_range([this.height, 0]);
            }
        },
    });

    return {
        BaseSelector: BaseSelector,
        BaseXSelector: BaseXSelector,
        BaseXYSelector: BaseXYSelector,
    };
});