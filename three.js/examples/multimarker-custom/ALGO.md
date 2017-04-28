# High Level Description

The workflow is splitted into 3 steps :

1. collect statistics about the relative position of each marker couple
1. generation of multi-marker description
1. using the multi-marker 

So we first have a learning phase to collect data and generating result, then
we have a usage phase, where the multi-marker is used in a AR application.

So in short, you put all your markers where you like them. Then you scan them
with your phone to collect statistics about their relative position.
When you are done, you start using the AR application with this multi-marker.

# Definitions
- a multi-marker is several markers acting as one
- a markerA is said to be a sub-marker of a multi-marker

# Learning Algo description
- every time i see markerA and markerB at the same time, i store statistics on their relative position
- such couple is called a seen-couple
- the statistics collected are simply an average of position/quaternion/scale
- this statistics can be trivially expressed as a transformation matrix

# Generation of Multi-Marker description
- when the learning is considered completed, we generate a multi marker description
  - it is a json file in which each sub-markers has a transformation matrix relative to the origin sub-marker
- the first sub-marker is the anchor/root sub-marker.
- The origin position of the multi-marker is the origin sub-marker
- the origin sub-marker MUST be seen at least once during the learning phase

## Description Format
- the description format is simple: 
- it is a list with one item for each sub-markers 
  - it contains a description of the sub-markers (e.g. marker barcode 3)
  - and a poseMatrix which is the transformation matrix relative to the origin sub-markers
  - the first item is the origin sub-marker
